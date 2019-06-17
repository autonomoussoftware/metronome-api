'use strict'

const promiseAllProps = require('promise-all-props')
const { eth } = require('config')
const { toWei } = require('web3-utils')

const toInt = str => Number.parseInt(str, 10)

class Status {
  constructor ({ logger, db, ethApi, socket }) {
    this.db = db
    this.logger = logger
    this.web3 = ethApi.web3
    this.socket = socket
    this.metronomeContracts = ethApi.metronomeContracts

    this._setupStatusTask()

    this.logger.info('Tasks initialized')
  }

  _emitStatus (socket) {
    // eslint-disable-next-line arrow-parens
    this.getStatus().then((status) => {
      socket.emit(this.socket.events.AUCTION_STATUS_TASK, status.auction)
      socket.emit(this.socket.events.STATUS_UPDATED, status)
    }).catch(err =>
      this.logger.warn('Failed to get Metronome status', err.message)
    )
  }

  _emitLatestBlock (socket, block) {
    if (block) {
      socket.emit(this.socket.events.LATEST_BLOCK, block)
      return
    }

    this.web3.eth.getBlock('latest')
      .then(latestBlock => socket.emit(this.socket.events.LATEST_BLOCK, latestBlock))
      .catch(err => this.logger.warn('Failed to get latest block', err.message)
      )
  }

  _setupStatusTask () {
    this.web3.eth.subscribe('newBlockHeaders', block => {
      this._emitLatestBlock(this.socket.io, block)
      this._emitStatus(this.socket.io)
    })

    this.socket.io.on('connection', socket => {
      this._emitLatestBlock(socket)
      this._emitStatus(socket)
    })

    this.logger.info('Status task initialized')
  }

  getStatus () {
    this.logger.verbose('Fetching status')

    const token = this.metronomeContracts.METToken.methods
    const auctions = this.metronomeContracts.Auctions.methods
    const converter = this.metronomeContracts.AutonomousConverter.methods

    const calls = {
      currentAuction: auctions.currentAuction().call().catch(() => 0),
      currentAuctionPrice: auctions.currentPrice().call().catch(() => 0),
      genesisTime: auctions.genesisTime().call().then(toInt),
      lastPurchasePrice: auctions.lastPurchasePrice().call(),
      lastPurchaseTick: auctions.lastPurchaseTick().call().then(toInt),
      heartbeat: auctions.heartbeat().call().catch(() => ({ minting: 0, nextAuctionGMT: 0 })),
      totalSupply: token.totalSupply().call(),
      availableMet: converter.getMetBalance().call(),
      availableEth: converter.getEthBalance().call(),
      currentConverterPrice: converter.getEthForMetResult(toWei('1')).call()
    }

    return promiseAllProps(calls)
      .then(({
        currentAuction,
        currentAuctionPrice,
        genesisTime,
        lastPurchasePrice,
        lastPurchaseTick,
        heartbeat,
        totalSupply,
        availableMet,
        availableEth,
        currentConverterPrice
      }) => {
        const status = {
          auction: {
            currentAuction,
            currentPrice: currentAuctionPrice,
            genesisTime,
            lastPurchasePrice,
            lastPurchaseTime: genesisTime + (lastPurchaseTick * 60),
            nextAuctionStartTime: toInt(heartbeat.nextAuctionGMT),
            tokenCirculation: totalSupply,
            tokenRemaining: heartbeat.minting,
            tokenSold: this.web3.utils.toBN(totalSupply).sub(this.web3.utils.toBN(eth.founderTokens)).toString(),
            tokenSupply: totalSupply
          },
          converter: {
            availableMet,
            availableEth,
            currentPrice: currentConverterPrice
          }
        }

        this.logger.verbose(`Status fetched: ${JSON.stringify(status)}`)
        return status
      })
      .catch(err => {
        this.logger.error(`Error fetching status: ${err}`)
        throw err
      })
  }
}

module.exports = Status
