'use strict'

const async = require('async')

class TokenExporter {
  constructor ({ config, logger, db, ethApi, socket }) {
    this.config = config
    this.db = db
    this.logger = logger
    this.metToken = ethApi.metronomeContracts.metToken
    this.web3 = ethApi.web3
    this.socket = socket

    this.logger.info(`Initializing exporter for token: ${this.metToken.options.address}`)

    this.allEvents = this.metToken.getPastEvents('allEvents', { fromBlock: config.exportStartBlock, toBlock: 'latest' })
    this.newEvents = this.metToken.events.allEvents({ fromBlock: 'latest' })

    this.newEvents.on('data', event => {
      this.logger.info(`New event received with address: ${event.address}`)

      if (!this._isEventValid(event)) { return }

      this._processEvent(event, err => {
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
      .on('error', err => {
        this.logger.error(`Error receiving new event: ${JSON.stringify(err)}`)
      })

    this.allEvents.then(events => {
      this.logger.info('All historical events were received')

      const accounts = {}

      events.forEach(e => {
        if (!this._isEventValid(e)) { return }

        if (e.event.toLowerCase() === 'transfer') {
          accounts[e.returnValues._from] = e.returnValues._from
          accounts[e.returnValues._to] = e.returnValues._to

          this._exportBalance(e.returnValues._from)
          this._exportBalance(e.returnValues._to)
        }

        if (e.event.toLowerCase() === 'approval') {
          accounts[e.returnValues._owner] = e.returnValues._owner
          accounts[e.returnValues._spender] = e.returnValues._spender

          this._exportBalance(e.returnValues._from)
          this._exportBalance(e.returnValues._to)
        }
      })

      async.eachSeries(
        events,

        (e, cb) => {
          if (!this._isEventValid(e)) { return cb() }
          this._processEvent(e, cb)
        },

        err => {
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
      .catch(err => {
        this.logger.error(`Error receiving historical events: ${err}`)
        // this.web3.eth.net.isListening()
        // .then((res) => console.log('Is listening?', res))
        // .catch((err) => console.log('Is listening?', err))
      })

    this.logger.info('Token Exporter initialized, waiting for historical events ⏰ ')
  }

  _isEventValid (e) {
    if (!e.event) {
      this.logger.warn(`Skip event with hash: ${e.transactionHash}, missing field event`)
      return false
    }

    if (e.event.toLowerCase() !== 'approval' && e.event.toLowerCase() !== 'transfer') {
      this.logger.warn(`Skip event with hash: ${e.transactionHash}, event ${e.event} does not match.`)
      return false
    }

    return true
  }

  _processEvent (event, cb) {
    const newEvent = {
      _id: `${event.blockNumber}_${event.transactionIndex}_${event.logIndex}`,
      metaData: event
    }

    this.logger.verbose(`Exporting event: ${newEvent._id}`)

    this.web3.eth.getBlock(event.blockNumber, false, (err, block) => {
      if (err) {
        this.logger.error(`Error retrieving block information for event: ${err}`)
        return cb(err)
      }

      newEvent.metaData.timestamp = block.timestamp

      if (event.args && event.args._value) {
        newEvent.metaData.args._value = newEvent.metaData.args._value.toNumber()
      }

      this.db.model('Event')
        .update({ _id: newEvent._id }, newEvent, { upsert: true })
        .then(() => {
          this.logger.info(`The event: ${newEvent._id} was exported successfully`)
          this.socket.io.emit(this.socket.events.NEW_EVENT, newEvent)
          cb && cb()
        })
        .catch(err => {
          if (err.message.indexOf('unique') !== -1) {
            this.logger.error(`The event: ${newEvent._id} was already exported`)
            return cb(err)
          }

          this.logger.error(`Error inserting event: ${err}`)
        })
    })
  }

  _exportBalance (address) {
    if (!address) { return }

    this.logger.info(`Exporting balance of address: ${address}`)

    const newBalance = {}

    this.metToken.methods.balanceOf(address)
      .call()
      .then(balance => {
        newBalance._id = address
        newBalance.balance = balance

        return this.db.model('Account')
          .update({ _id: newBalance._id }, newBalance, { upsert: true })
          .then(() => {
            this.socket.io.emit(this.socket.events.BALANCE_UPDATED, { address, balance })
          })
      })
      .then(() => {
        this.logger.info(`Balance exported successfully of address: ${newBalance._id}`)
      })
      .catch(err => {
        this.logger.error(`Error updating balance: ${err}`)
      })
  }
}

module.exports = TokenExporter
