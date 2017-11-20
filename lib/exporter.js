const async = require('async')

class Exporter {
  constructor(config, logger, db, api) {
    this.config = config
    this.db = db
    this.logger = logger
    this.contract = api.getToken()
    this.web3 = api.getWeb3()

    this.logger.info(`Getting Info for ${config.tokenAddress}`)

    this.allEvents = this.contract.getPastEvents('allEvents', { fromBlock: config.exportStartBlock, toBlock: 'latest' })
    this.newEvents = this.contract.events.allEvents()

    this.newEvents
      .on('data', (event) => {
        this.logger.info(`New log received wit address: ${log.address}`)

        this._processLog(log, (err) => {
          if (err) { return logger.warn(err) }
          this.logger.info(`New log processed wit address: ${log.address}`)
        })

        if (log.event === 'Transfer') {
          this._exportBalance(log.args._from)
          this._exportBalance(log.args._to)
        }

        if (log.event === 'Approval') {
          this._exportBalance(log.args._owner)
          this._exportBalance(log.args._spender)
        }
      })
      .on('changed', (event) => {
        // remove event from local database
      })
      .on('error', () => {
        this.logger.info(`Error receiving new log: {err}`)
      });

    this.allEvents.then(logs => {
      this.logger.info('Historical events received')

      const accounts = {}

      logs.forEach((log) => {
        if (log.type === 'Transfer') {
          accounts[log.args._from] = log.args._from
          accounts[log.args._to] = log.args._to
        }

        if (log.type === 'Approval') {
          accounts[log.args._owner] = log.args._owner
          accounts[log.args._spender] = log.args._spender
        }
      })

      async.eachSeries(
        logs,
        (log, cb) => this._processLog(log, cb),
        (err) => {
          this.logger.info('All historical logs processed')
          async.eachSeries(
            accounts,
            (item, cb) => this._exportBalance(item, cb),
            (err) => this.logger.info('All historical balances updated')
          )
        }
      )
    })
    .catch(err => this.logger.error(`Error receiving historical events: ${err}`))

    this.logger.info('Exporter initialized, waiting for historical events...')
  }

  _processLog(log, cb) {
    const event = {
      _id: `${log.blockNumber}_${log.transactionIndex}_${log.logIndex}`,
      metaData: log
    }

    this.logger.info(`Exporting log: ${event._id}`)

    this.web3.eth.getBlock(log.blockNumber, false, (err, block) => {
      if (err) {
        this.logger.info(`Error retrieving block information for log: ${err}`)
        return cb()
      }

      log.timestamp = block.timestamp

      if (log.args && log.args._value) {
        log.args._value = log.args._value.toNumber()
      }

      this.db.model('Event').create(event, (err, newLogs) => {
        if (err) {
          if (err.message.indexOf('unique') !== -1) {
            return this.logger.info(log._id, 'Already exported!')
          }

          this.logger.info(`Error inserting log: ${err}`)
        }

        cb && cb()
      })
    })
  }

  _exportBalance(address, cb) {
    this.logger.info('Exporting balance of', address)

    this.contract.balanceOf(address, (err, balance) => {
      const doc = { _id: address, balance: balance.toNumber() }

      this.db.model('Event')
        .update({ _id: doc._id }, doc, { upsert: true }, (err, numReplaced) => {
          if (err) { return this.logger.info('Error updating balance:', err) }

          this.logger.info('Balance export completed')
          cb && cb()
        })
    })
  }
}

module.exports = Exporter