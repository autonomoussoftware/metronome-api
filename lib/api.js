const Web3 = require('web3')
const erc20js = require('erc20js')
const metronome = require('metronomejs')

class Api {
  constructor(config) {
    this.config = config
    
    this.token = erc20js.getInstance(new Web3.providers.HttpProvider(config.rpcUrl))
    this.mtn = metronome.getInstance(new Web3.providers.HttpProvider(config.rpcUrl))

    this.token.options.address = config.tokenAddress
    this.mtn.auctions.options.address = config.tokenAddress
  }

  getMetronome() {
   return this.mtn
  }

  getToken() {
    return this.token
  }
}

module.exports = Api
