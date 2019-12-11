'use strict'

const promiseAllProps = require('promise-all-props')
const { eth } = require('config')
const createMetronomeStatus = require('metronome-sdk-status')

class Status {
  constructor ({logger, db, ethApi, socket}) {
    this.db = db
    this.logger = logger
    this.web3 = ethApi.web3
    this.socket = socket
    this.metronomeContracts = ethApi.metronomeContracts
    this.metronomeStatus = createMetronomeStatus(ethApi.metronomeContracts)

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

    const calls = {
      auctionStatus: this.metronomeStatus.getAuctionStatus(),
      converterStatus: this.metronomeStatus.getConverterStatus()
    }

    return promiseAllProps(calls)
      .then(({
        auctionStatus: {
          currAuction,
          currentAuctionPrice,
          genesisTime,
          lastPurchasePrice,
          lastPurchaseTime,
          minting,
          nextAuctionTime,
          proceedsBal,
          totalMET
        },
        converterStatus: {
          coinBalance,
          currentConverterPrice,
          metBalance
        }
      }) => {
        const status = {
          auction: {
            currentAuction: currAuction,
            currentPrice: currentAuctionPrice,
            genesisTime,
            lastPurchasePrice,
            lastPurchaseTime,
            nextAuctionStartTime: nextAuctionTime,
            tokenCirculation: totalMET,
            tokenRemaining: minting,
            tokenSold: this.web3.utils.toBN(totalMET)
              .sub(this.web3.utils.toBN(eth.founderTokens))
              .toString(),
            tokenSupply: totalMET
          },
          converter: {
            availableMet: metBalance,
            availableEth: coinBalance,
            currentPrice: currentConverterPrice
          },
          proceeds: {
            balance: proceedsBal
          }
        }

        this.logger.verbose(`Status fetched: ${JSON.stringify(status)}`)
        return status
      })
      .catch(err => {
        this.logger.warn(`Could not fetch status: ${err}`)
        throw err
      })
  }
}

module.exports = Status
