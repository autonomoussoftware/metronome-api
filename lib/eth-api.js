'use strict'

const net = require('net')
const Web3 = require('web3')
const MetronomeContracts = require('metronome-contracts')

class EthApi {
  constructor (config, logger, onConnect) {
    this.config = config
    this.logger = logger
    this.provider = this._getNewProvider()
    this.web3 = new Web3(this.provider)
    this.metronomeContracts = null
    this._reconnectInterval = null

    this.provider.on('end', () => {
      this.logger.warn('Ethereum node connection has ended')

      this._reconnectInterval = setInterval(() => {
        this.logger.info('Attempting to reconnect to Ethereum node...')
        this.provider = this._getNewProvider()
        this.web3 = new Web3(this.provider)

        this.provider.on('connect', () => {
          this.logger.info('Connected to Ethereum node')
          this.metronomeContracts = new MetronomeContracts(this.web3, config.chain)
          clearInterval(this._reconnectInterval)
          onConnect()
        })
      }, 3000)
    })

    this.provider.on('connect', () => {
      this.logger.info('Connected to Ethereum node')
      this.metronomeContracts = new MetronomeContracts(this.web3, config.chain)
      onConnect()
    })
  }

  _getNewProvider () {
    if (this.config.webSocketUrl) {
      return new Web3.providers.WebsocketProvider(this.config.webSocketUrl)
    } else if (this.config.ipcPath) {
      return new Web3.providers.IpcProvider(this.config.ipcPath, net)
    } else {
      throw new Error('Missing provider configuration')
    }
  }
}

module.exports = EthApi
