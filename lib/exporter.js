const async = require('async')

class Exporter {
  constructor (config, logger, db, api, socket) {
    this.config = config
    this.db = db
    this.logger = logger
    this.contract = api.getToken()
    this.web3 = api.getWeb3()
    this.socket = socket

    this.logger.info(`Getting Info for ${config.tokenAddress}`)

    this.allEvents = this.contract.getPastEvents('allEvents', { fromBlock: config.exportStartBlock, toBlock: 'latest' })
    this.newEvents = this.contract.events.allEvents()

    this.newEvents
      .on('data', (event) => {
        this.logger.info(`New event received with address: ${event.address}`)

        this._processEvent(event, (err) => {
          if (err) { return this.logger.error(err) }
          this.logger.info(`New event processed with address: ${event.address}`)
        })

        if (event.event.toLowerCase() === 'transfer') {
          this._exportBalance(event.returnValues._from)
          this._exportBalance(event.returnValues._to)
        }

        if (event.event.toLowerCase() === 'approval') {
          this._exportBalance(event.returnValues._owner)
          this._exportBalance(event.returnValues._spender)
        }
      })
      .on('changed', (event) => {
        // TODO: remove event from local database
      })
      .on('error', (err) => {
        this.logger.error(`Error receiving new event: ${err}`)
      })

    this.allEvents.then(events => {
      this.logger.info('All historical events were received')

      const accounts = {}

      events.forEach((e) => {
        if (e.type.toLowerCase() === 'transfer') {
          accounts[e.args._from] = e.args._from
          accounts[e.args._to] = e.args._to
        }

        if (e.type.toLowerCase() === 'approval') {
          accounts[e.args._owner] = e.args._owner
          accounts[e.args._spender] = e.args._spender
        }
      })

      async.eachSeries(
        events,
        (event, cb) => this._processEvent(event, cb),
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

  _processEvent (event, cb) {
    const newEvent = {
      _id: `${event.blockNumber}_${event.transactionIndex}_${event.logIndex}`,
      metaData: event
    }

    this.logger.info(`Exporting event: ${newEvent._id}`)

    this.web3.eth.getBlock(event.blockNumber, false, (err, block) => {
      if (err) {
        this.logger.info(`Error retrieving block information for event: ${err}`)
        return cb()
      }

      newEvent.timestamp = block.timestamp

      if (newEvent.args && newEvent.args._value) {
        newEvent.args._value = newEvent.args._value.toNumber()
      }

      this.db.model('Event')
        .update({ _id: newEvent._id }, newEvent, { upsert: true })
        .then(() => {
          this.logger.info(`The event: ${newEvent._id} was created successfully`)
          this.socket.emit('event', newEvent)
          cb && cb()
        })
        .catch((err) => {
          if (err.message.indexOf('unique') !== -1) {
            return this.logger.info(`The event: ${newEvent._id} was already exported`)
          }

          this.logger.error(`Error inserting event: ${err}`)
        })
    })
  }

  _exportBalance (address, cb) {
    this.logger.info(`Exporting balance of: ${address}`)

    const newBalance = {}

    this.contract.methods.balanceOf(address)
      .call()
      .then((balance) => {
        newBalance._id = address
        newBalance.balance = balance

        return this.db.model('Balance').update({ _id: newBalance._id }, newBalance, { upsert: true })
      })
      .then(() => {
        this.logger.info(`The balance export for event: ${newBalance._id} completed`)
        cb && cb()
      })
      .catch((err) => {
        this.logger.info(`Error updating balance: ${err}`)
      })
  }
}

module.exports = Exporter
