const promiseAllProps = require('promise-all-props')
const { eth } = require('config')

const toInt = str => Number.parseInt(str, 10)

class Auction {
  constructor (logger, db, ethApi, socket) {
    this.db = db
    this.logger = logger
    this.metronome = ethApi.metronome
    this.web3 = ethApi.web3
    this.socket = socket

    this._setupAuctionStatusTask()

    this.logger.info('Tasks initialized')
  }

  _emitAuctionStatus (socket) {
    this.getAuctionStatus().then(status => socket.emit(this.socket.events.AUCTION_STATUS_TASK, status))
  }

  _emitLatestBlock (socket, block) {
    if (block) {
      return socket.emit(this.socket.events.LATEST_BLOCK, block)
    }

    this.web3.eth.getBlock('latest').then(block => socket.emit(this.socket.events.LATEST_BLOCK, block))
  }

  _setupAuctionStatusTask () {
    this.web3.eth.subscribe('newBlockHeaders', block => {
      this._emitLatestBlock(this.socket.io, block)
      this._emitAuctionStatus(this.socket.io)
    })

    this.socket.io.on('connection', socket => {
      this._emitLatestBlock(socket)
      this._emitAuctionStatus(socket)
    })

    this.logger.info('Auction status task initialized')
  }

  getAuctionStatus () {
    this.logger.verbose('Fetching auction status')

    const token = this.metronome.metToken.methods
    const auctions = this.metronome.auctions.methods

    const calls = {
      currentAuction: auctions.currentAuction().call().catch(() => 0),
      currentPrice: auctions.currentPrice().call().catch(() => 0),
      genesisTime: auctions.genesisTime().call().then(toInt),
      globalMetSupply: auctions.heartbeat().call(),
      lastPurchasePrice: auctions.lastPurchasePrice().call(),
      lastPurchaseTick: auctions.lastPurchaseTick().call().then(toInt),
      heartbeat: auctions.heartbeat().call().catch(() => ({ minting: 0, nextAuctionGMT: 0 })),
      totalSupply: token.totalSupply().call()
    }

    return promiseAllProps(calls)
      .then(
        ({
          currentAuction,
          currentPrice,
          genesisTime,
          globalMetSupply,
          lastPurchasePrice,
          lastPurchaseTick,
          heartbeat,
          totalSupply
        }) => {
          const status = {
            currentAuction,
            currentPrice,
            genesisTime,
            lastPurchasePrice,
            lastPurchaseTime: genesisTime + (lastPurchaseTick * 60),
            nextAuctionStartTime: toInt(heartbeat.nextAuctionGMT),
            tokenCirculation: totalSupply,
            tokenRemaining: heartbeat.minting,
            tokenSold: this.web3.utils.toBN(totalSupply).sub(this.web3.utils.toBN(eth.founderTokens)).toString()
          }

          this.logger.verbose(`Auction status fetched: ${JSON.stringify(status)}`)
          return status
        }
      )
      .catch(err => {
        this.logger.error(`Error fetching auction status: ${err}`)
        throw err
      })
  }
}

module.exports = Auction
