const async = require('async')

class Exporter {
  constructor (config, logger, db, api) {
    this.config = config
    this.db = db
    this.logger = logger
    this.contract = api.getToken()
    this.web3 = api.getWeb3()

    this.logger.info(`Getting Info for ${config.tokenAddress}`)

    this.allEvents = this.contract.getPastEvents('allEvents', { fromBlock: config.exportStartBlock, toBlock: 'latest' })
    this.newEvents = this.contract.events.allEvents({}, (err, info) => {
      console.log(err, info)
    })

    this.newEvents
      .on('data', (event) => {
        this.logger.info(`New event received with address: ${event.address}`)

        this._processLog(event, (err) => {
          if (err) { return this.logger.error(err) }
          this.logger.info(`New event processed with address: ${event.address}`)
        })

        if (event.event === 'Transfer') {
          this._exportBalance(event.returnValues._from)
          this._exportBalance(event.returnValues._to)
        }

        if (event.event === 'Approval') {
          this._exportBalance(event.returnValues._owner)
          this._exportBalance(event.returnValues._spender)
        }
      })
      .on('changed', (event) => {
        // remove event from local database
      })
      .on('error', (err) => {
        this.logger.error(`Error receiving new event: ${err}`)
      })

    this.allEvents.then(logs => {
      this.logger.info('All historical events were received')

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
          if (err) {
            return this.logger.error(`Error processing historical events: ${err}`)
          }

          this.logger.info('All historical events were processed')

          async.eachSeries(
            accounts,
            (item, cb) => this._exportBalance(item, cb),
            () => this.logger.info('All historical balances were updated')
          )
        }
      )
    })
      .catch(err => this.logger.error(`Error receiving historical events: ${err}`))

    this.logger.info('Exporter initialized, waiting for historical events ⏰ ')
  }

  _processLog (log, cb) {
    const event = {
      _id: `${log.blockNumber}_${log.transactionIndex}_${log.logIndex}`,
      metaData: log
    }

    this.logger.info(`Exporting event: ${event._id}`)

    this.web3.eth.getBlock(log.blockNumber, false, (err, block) => {
      if (err) {
        this.logger.info(`Error retrieving block information for event: ${err}`)
        return cb()
      }

      log.timestamp = block.timestamp

      if (log.args && log.args._value) {
        log.args._value = log.args._value.toNumber()
      }

      this.db.model('Event').update({ _id: event._id }, event, { upsert: true }, (err) => {
        if (err) {
          if (err.message.indexOf('unique') !== -1) {
            return this.logger.info(`The event: ${event._id} was already exported`)
          }

          this.logger.info(`Error inserting event: ${err}`)
        }

        this.logger.info(`The event: ${event._id} was created successfully`)
        cb && cb()
      })
    })
  }

  _exportBalance (address, cb) {
    this.logger.info(`Exporting balance of: ${address}`)

    console.log(this.contract)

    const balance = this.contract.methods.balanceOf(address)
    const event = { _id: address, balance }

    this.db.model('Event')
      .update({ _id: event._id }, event, { upsert: true }, (err) => {
        if (err) { return this.logger.info(`Error updating balance:  ${err}`) }

        this.logger.info(`The balance export for event: ${event._id} completed`)
        cb && cb()
      })
  }
}

module.exports = Exporter
