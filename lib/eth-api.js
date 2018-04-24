const net = require('net')
const Web3 = require('@ianaya89/web3')
const Metronome = require('metronomejs')

class EthApi {
  constructor (config) {
    this.config = config
    this.web3 = new Web3(this._getNewProvider())
    this.metronome = new Metronome(this.web3)
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
