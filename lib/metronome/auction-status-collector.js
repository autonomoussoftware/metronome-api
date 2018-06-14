'use strict'

const { eth: { chain, webSocketUrl } } = require('config')
const MetronomeContracts = require('metronome-contracts')
const Web3 = require('web3')

const { subscribe } = require('../web3-block-subscribe')

const db = require('../stats-db')
const logger = require('../../logger')

const web3 = new Web3(webSocketUrl)

const { auctions } = new MetronomeContracts(web3, chain)

function onData (header) {
  logger.debug('Received header %s', header.hash)

  auctions.methods.heartbeat().call()
    .then(function (heartbeat) {
      return db.storeData({ header, heartbeat })
    })
    .catch(function (err) {
      logger.warn('No heartbeat? %s', err.message)
    })
}

function onError (err) {
  logger.warn('Something went wrong: %s', err.message)
}

function start () {
  const subscription = subscribe({ url: webSocketUrl, onData, onError })

  return {
    stop: () => subscription.unsubscribe()
  }
}

module.exports = { start }
