const Web3 = require('web3')
const erc20js = require('erc20js')
const metronome = require('metronomejs')

const net = require('net')

class Api {
  constructor (config) {
    this.config = config

    // this.provider = new Web3.providers.HttpProvider(config.rpcUrl)

    this.ipcPath = process.env['HOME'] + '/Library/Ethereum/geth.ipc'

    this.provider = new Web3.providers.IpcProvider(this.ipcPath, net)

    this.web3 = new Web3(this.provider)
    this.token = erc20js.getInstance(this.provider)
    this.mtn = metronome.getInstance(this.provider)

    this.accounts = this.web3.eth.accounts

    this.token.options.address = config.tokenAddress
    this.mtn.auctions.options.address = config.tokenAddress
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

module.exports = Api
