const net = require('net')
const Web3 = require('web3')
const erc20js = require('erc20js')
const metronome = require('metronomejs')

class EthApi {
  constructor (config) {
    this.config = config
    const provider = new Web3.providers.IpcProvider(config.ipcPath, net)
    // const provider = new Web3.providers.HttpProvider('http://localhost:8545')
    this.provider = provider

    this.web3 = new Web3(this.provider)
    this.token = erc20js.getInstance(this.provider)
    this.mtn = metronome.getInstance(this.provider)

    this.accounts = this.web3.eth.accounts

    this.token.options.address = config.tokenAddress
    this.mtn.auctions.options.address = config.auctionAddress
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
