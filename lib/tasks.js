const promiseAllProps = require('promise-all-props')

const PRICE_FORMAT = 'ether'

const toInt = str => parseInt(str, 10)

class Tasks {
  constructor (config, logger, db, ethApi, socket) {
    this.config = config
    this.db = db
    this.logger = logger
    this.metronome = ethApi.getMetronome()
    this.token = ethApi.getToken()
    this.web3 = ethApi.getWeb3()
    this.socket = socket

    this._setupAuctionStatusTask()

    this.logger.info('Tasks initialized')
  }

  _emitAuctionStatus(socket) {
    this.getAuctionStatus().then(status => socket.emit(this.socket.events.AUCTION_STATUS_TASK, status))
  }

  _emitLatestBlock (socket, block) {
    if (block) {
      return this.socket.io.emit(this.socket.events.LATEST_BLOCK, block)
    }

    this.web3.eth.getBlock('latest').then(block => this.socket.io.emit(this.socket.events.LATEST_BLOCK, block))
  }

  _setupAuctionStatusTask () {
    this.web3.eth.subscribe('newBlockHeaders', block => {
      // this._emitLatestBlock(this.socket.io, block)
      this._emitAuctionStatus(this.socket.io)
    })

    this.socket.io.on('connection', socket => {
      // this._emitLatestBlock(socket)
      this._emitAuctionStatus(socket)
    })

    this.logger.info('Auction status task initialized')
  }

  getAuctionStatus () {
    this.logger.verbose('Fetching auction status')

    const token = this.metronome.mtntoken.methods
    const auctions = this.metronome.auctions.methods

    return promiseAllProps({
      currentAuction: auctions.currentAuction().call(),
      currentPrice: auctions.currentPrice().call(),
      genesisTime: auctions.genesisTime().call().then(toInt),
      globalMtnSupply: auctions.globalMtnSupply().call(),
      lastPurchasePrice: auctions.lastPurchasePrice().call(),
      lastPurchaseTick: auctions.lastPurchaseTick().call().then(toInt),
      mintable: auctions.mintable().call(),
      nextAuction: auctions.nextAuction().call(),
      totalSupply: token.totalSupply().call()
    })
      .then(
        ({
          currentAuction,
          currentPrice,
          genesisTime,
          globalMtnSupply,
          lastPurchasePrice,
          lastPurchaseTick,
          mintable,
          nextAuction,
          totalSupply
        }) => {
          const status = {
            currentAuction,
            currentPrice,
            genesisTime,
            lastPurchasePrice,
            lastPurchaseTime: genesisTime + lastPurchaseTick * 60,
            nextAuctionStartTime: toInt(nextAuction._startTime),
            tokenCirculation: totalSupply,
            tokenRemaining: mintable,
            tokenSold: globalMtnSupply - mintable
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

module.exports = Tasks
