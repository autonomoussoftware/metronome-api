'use strict'

const async = require('async')
const Metronome = require('../metronome')
class ACCExporter extends Metronome {
  constructor(db, ethApi, socket) {
    super(db, ethApi, socket)
    this.db.model('Value').findOne({ key: 'bestBlock' })
      .then(({ value }) => this._init(value))
      .catch(() => this._init())
  }

  _init (bestBlock = this.config.exportStartBlock) {

    this.allEvents = this.getPastEvents(this.acc, 'allEvents', bestBlock, 'latest')
    this.newEvents = this.acc.events.allEvents({ fromBlock: 'latest' })
  
    this.allEvents
      .then(events => {
        this.logger.info(`${events.length} historical events were received from ACC ${bestBlock}`)
  
        async.eachSeries(
          events,
          (event, cb) => this.processEvent(event, cb),
          err => this.onProcessEvents(err, events)
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
      })
      .on('error', err => this.logger.error(`Error receiving new event: ${JSON.stringify(err)}`))
  
    this.logger.info(`ACC Exporter initialized, waiting for historical events from block ${bestBlock} ⏰`)
  }
}



module.exports = ACCExporter
