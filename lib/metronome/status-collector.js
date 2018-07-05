'use strict'

const { eth: { chain, webSocketUrl } } = require('config')
const MetronomeContracts = require('metronome-contracts')
const Web3 = require('web3')
const promiseAllProps = require('promise-all-props')

const { subscribe } = require('../web3-block-subscribe')

const db = require('../stats-db')
const logger = require('../../logger')

const web3 = new Web3(webSocketUrl)
const { auctions, autonomousConverter } = new MetronomeContracts(web3, chain)

const getHeartbeat = () => auctions.methods.heartbeat().call()
const getConverterStatus = () => promiseAllProps({
  availableMet: autonomousConverter.methods.getMetBalance().call(),
  availableEth: autonomousConverter.methods.getEthBalance().call(),
  currentConverterPrice: autonomousConverter.methods.getEthForMetResult('1000000000000000000').call()
})

function onData (header) {
  logger.debug('Received header %s', header.hash)

  promiseAllProps({
    heartbeat: getHeartbeat(),
    converterStatus: getConverterStatus()
  })
    .then(function ({ heartbeat, converterStatus }) {
      return db.storeData({ header, heartbeat, converterStatus })
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
