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

    this.statusTask = this._setupAuctionStatusTask()

    this.logger.info('Tasks initialized')
  }

  _setupAuctionStatusTask () {
    const interval = setInterval(
      () => this.getAuctionStatus()
        .then(res => this.socket.io.emit(this.socket.events.AUCTION_STATUS_TASK, res)),
      10000
    )

    this.logger.info('Auction status task initialized')
    return interval
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

            tokenSold: mintable / 1e18,
            tokenCirculation: totalSupply / 1e18,
            tokenRemaining: totalSupply / 1e18 - mintable / 1e18,
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
