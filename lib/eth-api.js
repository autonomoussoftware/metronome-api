const net = require('net')
const Web3 = require('web3-bloq')
const erc20js = require('erc20js')
const metronome = require('metronomejs')

class EthApi {
  constructor (config) {
    this.config = config

    this.web3 = new Web3(this._getNewProvider())
    this.token = erc20js.getInstance(this._getNewProvider())
    this.mtn = metronome.getInstance(this._getNewProvider())

    this.accounts = this.web3.eth.accounts

    this.token.options.address = config.tokenAddress
    this.mtn.mtntoken.options.address = config.tokenAddress
    this.mtn.auctions.options.address = config.auctionAddress
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

  getWeb3 () {
    return this.web3
  }

  getMetronome () {
    return this.mtn
  }

  getToken () {
    return this.token
  }
}

module.exports = EthApi
