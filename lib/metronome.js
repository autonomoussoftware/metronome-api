'use strict'

const async = require('async')
const logger = require('../logger')
const config = require('config')

class Metronome {
  constructor(db, ethApi, socket) {
    this.logger = logger
    this.config = config.eth
    this.socket = socket
    this.db = db
    this.web3 = ethApi.web3
    const metronomeContracts = ethApi.metronomeContracts
    this.metToken = metronomeContracts.METToken
    this.acc = metronomeContracts.AutonomousConverter
    this.auction = metronomeContracts.Auctions
    this.validEvents = ['Approval', 'Transfer', 'ConvertMetToEth', 'ConvertEthToMet', 'LogAuctionFundsIn']
  }


  async getPastEvents(contract, eventName, startBlock, endBlock) {
    let fromBlock = startBlock
    let toBlock = endBlock
    const events = []
    const batchSize = 100000

    if (endBlock === 'latest') {
      // eslint-disable-next-line no-param-reassign
      endBlock = await this.web3.eth.getBlockNumber()
      toBlock = endBlock
    }

    if (toBlock - fromBlock > batchSize) {
      toBlock = fromBlock + batchSize
    }
    this.logger.debug(`End block is ${endBlock}`)
    this.logger.debug(`Events array size is ${events.length}`)

    while (toBlock <= endBlock) {
      this.logger.debug(`Processing from block ${fromBlock} to ${toBlock}`)
      
      const retrievedEvents = await contract.getPastEvents(eventName, { fromBlock, toBlock })
      events.push(retrievedEvents)

      fromBlock = toBlock
      toBlock = fromBlock + batchSize
      if (toBlock > endBlock && fromBlock < endBlock) {
        toBlock = endBlock
      }
    }
    return events.flat(Infinity)
  }

  saveBestBlock(e) {
    if (!e) { return }

    const bestBlock = { key: 'bestBlock', value: e.blockNumber }
    this.logger.info(`Updating best block to: ${bestBlock.value}`)

    this.db.model('Value').update({ key: 'bestBlock' }, bestBlock, { upsert: true })
      .then(() => this.logger.info(`Updated best block to: ${bestBlock.value}`))
      .catch(err => this.logger.error(`Error updating best block: ${err}`))
  }

  isEventValid(e) {
    if (!e) { return false }

    if (!e.event) {
      this.logger.warn(`Skip event with hash: ${e.transactionHash}, missing field event`)
      return false
    }

    if (!this.validEvents.includes(e.event)) {
      this.logger.warn(`Skip event with hash: ${e.transactionHash}, event ${e.event} is not a valid match.`)
      return false
    }

    return true
  }

  processEvent(event, cb) {
    if (!this.isEventValid(event)) { return cb() }

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
          cb()
        })
        .catch(err => {
          if (err.message.indexOf('unique') !== -1) {
            this.logger.error(`The event: ${newEvent._id} was already exported`)
            return cb(err)
          }

          this.logger.error(`Error inserting event: ${err}`)
          cb(err)
        })
    })
  }

  onProcessEvents(err, events, accounts) {
    if (err) {
      return this.logger.error(`Error processing historical events: ${err}`)
    }

    this.saveBestBlock(events[events.length - 1])
    this.logger.info('All historical events were processed')

    if (accounts) {
      async.eachSeries(
        accounts,
        (item, cb) => this._exportBalance(item, cb),
        () => this.logger.info('All historical balances were updated')
      )
    }
  }
}

module.exports = Metronome
