'use strict'

const { eth: { chain, webSocketUrl } } = require('config')
const MetronomeContracts = require('metronome-contracts')
const Web3 = require('web3')
const promiseAllProps = require('promise-all-props')

const db = require('../stats-db')
const logger = require('../../logger')

const web3 = new Web3(
  new Web3.providers.WebsocketProvider(webSocketUrl, { autoReconnect: true })
)
const { Auctions, AutonomousConverter } = new MetronomeContracts(web3, chain)

const getHeartbeat = () => Auctions.methods.heartbeat().call()
const getConverterStatus = () => promiseAllProps({
  availableMet: AutonomousConverter.methods.getMetBalance().call(),
  availableEth: AutonomousConverter.methods.getEthBalance().call(),
  currentConverterPrice: AutonomousConverter.methods.getEthForMetResult('1000000000000000000').call()
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
  const subscription = web3.eth.subscribe('newBlockHeaders')
  subscription.on('data', onData)
  subscription.on('error', onError)

  return {
    stop: () => subscription.unsubscribe()
  }
}

module.exports = { start }
