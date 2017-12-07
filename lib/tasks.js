const moment = require('moment')
const events = require('./events')

class Tasks {
  constructor (config, logger, db, ethApi, socket) {
    this.config = config
    this.db = db
    this.logger = logger
    this.metronome = ethApi.getMetronome()
    this.socket = socket

    // TODO: remove this call, only for testing
    // this.getAuctionStatus()

    this.statusTask = this._setupAuctionStatusTask()

    this.logger.info('Tasks initialized')
  }

  _setupAuctionStatusTask () {
    const interval = setInterval(() =>
      this.getAuctionStatus()
        .then((res) => this.socket.emit(events.AUCTION_STATUS_TASK, res)),
    10000)

    this.logger.info('Auction status task initialized')

    return interval
  }

  getAuctionStatus (amount = '1', date = moment()) {
    const uTime = date.unix()
    const auctions = this.metronome.auctions.methods

    // const BN = this.metronome.web3.utils.BN

    // const encoded = auctions.whatWouldPurchaseDo(amount, uTime).encodeABI()
    // const decoded = this.metronome.web3.eth.abi.decodeParameters(['uint256', 'uint256'], encoded)

    // console.log({
    //   3: new BN(decoded[0]),
    //   2: new BN(decoded[1])
    // })

    // // const encoded2 = auctions.whatWouldPurchaseDo(amount, uTime)

    const stats = [
      auctions.currentPrice().call()
      // auctions.whatWouldPurchaseDo(amount, uTime).call()
    ]

    return Promise.all(stats)
      .then(([currentPrice, auctStatus]) => {
        const res = {
          currentPrice,
          auctStatus,
          uTime
        }

        this.logger.verbose('auction status fetched:', res)
        return res
      })
      .catch(err => {
        this.logger.error('error getting auction status:', err)
        throw err
      })
  }
}

module.exports = Tasks