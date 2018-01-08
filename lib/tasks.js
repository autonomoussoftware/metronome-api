const PRICE_FORMAT = 'ether'

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

  _emitAuctionStatus (socket) {
    this.getAuctionStatus().then(
      status => socket.emit(this.socket.events.AUCTION_STATUS_TASK, status)
    )
  }

  _setupAuctionStatusTask () {
    this.web3.eth.subscribe('newBlockHeaders',
      () => this._emitAuctionStatus(this.socket.io)
    )

    this.socket.io.on('connection', socket => this._emitAuctionStatus(socket))

    this.logger.info('Auction status task initialized')
  }

  getAuctionStatus () {
    this.logger.verbose('Fetching auction status')

    const auctions = this.metronome.auctions.methods
    const token = this.metronome.mtntoken.methods
    const eth = this.web3.eth

    const stats = [
      auctions.currentPrice().call(),
      auctions.lastPurchasePrice().call(),

      auctions.lastPurchaseTick().call(),
      auctions.genesisTime().call(),

      auctions.nextAuction().call(),

      auctions.globalMtnSupply().call(),
      auctions.mintable().call(),

      auctions.auctionSupply().call(),
      auctions.auctionStartTime().call(),

      eth.getBlock('latest'),

      token.totalSupply().call()
    ]

    return Promise.all(stats)
      .then(
        ([
          currentPrice,
          lastPurchasePrice,

          lastPurchaseTick,
          genesisTime,

          nextAuction,

          globalMtnSupply,
          mintable,

          auctionSupply,
          nextAuctionStartTime,

          blockInfo,
          totalSupply
        ]) => {
          const res = {
            currentPrice: this.web3.utils.fromWei(currentPrice, PRICE_FORMAT),
            lastPurchasePrice: this.web3.utils.fromWei(lastPurchasePrice, PRICE_FORMAT),

            lastPurchaseTime: parseInt(genesisTime) + parseInt(lastPurchaseTick) * 60,

            tokenSold: totalSupply / 1e18 - mintable / 1e18,
            tokenCirculation: totalSupply / 1e18,
            tokenRemaining: mintable / 1e18,
            nextAuctionStartTime: parseInt(nextAuction._startTime, 10),

            genesisTime
          }

          this.logger.verbose(`Auction status fetched`, res)
          return res
        }
      )
      .catch(err => {
        this.logger.error(`Error fetching auction status: ${err}`)
        throw err
      })
  }
}

module.exports = Tasks
