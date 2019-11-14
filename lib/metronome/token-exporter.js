'use strict'

const async = require('async')
const Metronome = require('../metronome')
class TokenExporter extends Metronome {
  constructor(db, ethApi, socket) {
    super(db, ethApi, socket)
    this.logger.info(`Initializing exporter for token: ${this.metToken.options.address}`)
    this.db.model('Value').findOne({ key: 'bestBlock' })
      .then(({ value }) => this._init(value))
      .catch(() => this._init())
  }

  _init(bestBlock = this.config.exportStartBlock) {
    this.allEvents = this.getPastEvents(this.metToken, 'allEvents', bestBlock, 'latest')
    this.newEvents = this.metToken.events.allEvents({ fromBlock: 'latest' })

    this.allEvents
      .then(events => {
        this.logger.info(`${events.length} historical events were received from block ${bestBlock}`)

        const accounts = {}

        events.forEach(e => {
          if (!this.isEventValid(e)) { return }

          if (e.event.toLowerCase() === 'transfer') {
            accounts[e.returnValues._from] = e.returnValues._from
            accounts[e.returnValues._to] = e.returnValues._to

            this._exportBalance(e.returnValues._from)
            this._exportBalance(e.returnValues._to)
          } else if (e.event.toLowerCase() === 'approval') {
            accounts[e.returnValues._owner] = e.returnValues._owner
            accounts[e.returnValues._spender] = e.returnValues._spender

            this._exportBalance(e.returnValues._from)
            this._exportBalance(e.returnValues._to)
          }
        })

        async.eachSeries(
          events,
          (event, cb) => this.processEvent(event, cb),
          err => this.onProcessEvents(err, events, accounts)
        )
      })
      .catch(err => this.logger.error(`Error receiving historical events: ${err}`))

    this.newEvents
      .on('data', event => {
        this.logger.info(`New event received with address: ${event.address}`)

        this.processEvent(event, err => {
          if (err) { return this.logger.error(err) }

          this.logger.info(`New event processed with address: ${event.address}`)
          this.saveBestBlock(event)
        })

        if (event.event.toLowerCase() === 'transfer') {
          this._exportBalance(event.returnValues._from)
          this._exportBalance(event.returnValues._to)
        } else if (event.event.toLowerCase() === 'approval') {
          this._exportBalance(event.returnValues._owner)
          this._exportBalance(event.returnValues._spender)
        }
      })
      .on('error', err => this.logger.error(`Error receiving new event: ${JSON.stringify(err)}`))

    this.logger.info(`Token Exporter initialized, waiting for historical events from block ${bestBlock} ⏰`)
  }

  _exportBalance(address) {
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
          .then(() => this.socket.io.emit(this.socket.events.BALANCE_UPDATED, { address, balance }))
      })
      .then(() => this.logger.info(`Balance exported successfully of address: ${newBalance._id}`))
      .catch(err => this.logger.error(`Error updating balance: ${err}`))
  }
}

module.exports = TokenExporter
