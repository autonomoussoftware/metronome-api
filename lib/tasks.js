const moment = require('moment')
const events = require('./events')

const PRICE_FORMAT = 'ether'

class Tasks {
  constructor (config, logger, db, ethApi, socket) {
    this.config = config
    this.db = db
    this.logger = logger
    this.metronome = ethApi.getMetronome()
    this.web3 = ethApi.getWeb3()
    this.socket = socket

    this.statusTask = this._setupAuctionStatusTask()

    this.logger.info('Tasks initialized')
  }

  _setupAuctionStatusTask () {
    const interval = setInterval(
      () =>
        this.getAuctionStatus().then(res =>
          this.socket.emit(events.AUCTION_STATUS_TASK, res)
        ),
      10000
    )

    this.logger.info('Auction status task initialized')

    return interval
  }

  getAuctionStatus () {
    const auctions = this.metronome.auctions.methods

    const stats = [
      auctions.currentPrice().call(),
      auctions.lastPurchasePrice().call(),

      auctions.currentTick().call(),
      auctions.lastPurchaseTick().call(),

      auctions.currentAuction().call(),
      auctions.nextAuction().call(),

      auctions.globalMtnSupply().call(),
      auctions.mintable().call(),

      auctions.auctionSupply().call(),
      auctions.globalDailySupply().call(),
      auctions.auctionStartTime().call()
    ]

    return Promise.all(stats)
      .then(
        (
          [
            currentPrice,
            lastPurchasePrice,

            currentTick,
            lastPurchaseTime,

            currentAuction,
            nextAuction,

            totalTokens,
            tokenLeft,

            auctionSupply,
            globalDailySupply,
            auctionStartTime
          ]
        ) => {
          const res = {
            currentPrice: this.web3.utils.fromWei(currentPrice, PRICE_FORMAT),
            lastPurchasePrice: this.web3.utils.fromWei(lastPurchasePrice, PRICE_FORMAT),
            currentTick,
            lastPurchaseTime,
            currentAuction,
            nextAuction,
            totalTokens,
            tokenLeft,
            auctionStartTime
          }

          this.logger.verbose('auction status fetched:', res)
          return res
        }
      )
      .catch(err => {
        this.logger.error('error getting auction status:', err)
        throw err
      })
  }
}

module.exports = Tasks
