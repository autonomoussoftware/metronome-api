'use strict'

const Router = require('express').Router
const marketData = require('../lib/market-data')
const db = require('../lib/stats-db')
const converterStats = require('./stats/converter-stats')
const auctionsStats = require('./stats/auction-stats')
const moment = require('moment-timezone')
const config = require('config')
const BigNumber = require('bignumber.js')
const router = new Router()

function parseFromTo(req, res, next) {
  moment.tz.setDefault('UTC')
  const { query } = req

  try {

    query.to = Number.parseInt(query.to || (Date.now() / 1000))
    query.from = Number.parseInt(query.from || config.eth.birthTime)

    const toDate = moment.unix(query.to)
    const fromDate = moment.unix(query.from)

    // Diff by minute will return 1, if from-to is larget than 1 minute
    query.days = Math.ceil(toDate.diff(fromDate, 'minutes') / 1440)

    // Same day
    if (query.days === 0) {
      query.days = 1
    }
    next()
  } catch (err) {
    next(err)
  }
}

function statusData() {
  const to = Date.now() / 1000
  const from = to - 3600
  return db.getData(from, to).then(data => data[data.length - 1])
}

function metStats(req, res, next) {
  req.logger.info('Querying met stats')
  // Query will return accounts where balance > 0
  const metHolderQuery = {
    $expr: { $gt: [{ $toDouble: '$balance' }, 0] }
  }

  Promise.all([
    marketData.getRate('ethereum'),
    marketData.getMarketData('metronome'),
    statusData(),
    req.model('Account').countDocuments(metHolderQuery)
  ]).then(([rate, marketData, status, totalMetHolders]) => {
    const price = {}
    const valueBN = new BigNumber(marketData.value)
    price.eth = valueBN.dividedBy(rate).toFixed(18)
    price.usd = valueBN.toFixed(2)

    const stats = {}
    stats.symbol = marketData.symbol
    stats.price = price
    stats.marketCapUsd = new BigNumber(marketData.marketCapUsd).toFixed(2)
    stats.totalSupply = new BigNumber(status.totalMET)
      .dividedBy(1e18)
      .toFixed(18)
    stats.circulatingSupply = new BigNumber(marketData.supply).toFixed(18)
    stats.proceeds = new BigNumber(status.proceedsBal)
      .dividedBy(1e18)
      .toFixed(18)
    stats.metHolders = totalMetHolders

    req.logger.verbose('Sending met stats to client')
    res.send(stats)
  }).catch(err => next(err))
}

function auction(req, res, next) {
  const logQuery = JSON.stringify(req.query)
  req.logger.info(`Querying auction stats: ${logQuery}`)

  moment.tz.setDefault('UTC')
  Promise.all([
    marketData.getRate('ethereum'),
    statusData(),
    auctionsStats.getBuyerCount(req.model('Event'), req.query),
    auctionsStats.getlastAuctionPrices(req.model('Event'))
  ]).then(([rate, data, buyerCount, lastPrices]) => {
    const currentPrice = {}
    const auctionPrice = new BigNumber(data.currentAuctionPrice).dividedBy(1e18)
    currentPrice.eth = auctionPrice.toFixed(18)
    currentPrice.usd = auctionPrice.multipliedBy(rate).toFixed(2)

    const price = {}
    price.currentPrice = currentPrice
    price.lastOpeningPrice = lastPrices.lastOpeningPrice
    price.lastClosingPrice = lastPrices.lastClosingPrice

    const stats = {}
    stats.price = price
    stats.availability = new BigNumber(data.minting).dividedBy(1e18).toFixed(18)
    stats.totalAuctions = data.currAuction

    const nextMidnight = moment().startOf('day').add(1, 'day')
    stats.timeRemaining = nextMidnight.diff(moment(), 'seconds')

    stats.uniqueBuyerCount = buyerCount

    req.logger.verbose('Sending auction stats to client')
    res.send(stats)
  }).catch(err => next(err))
}

function auctionAverage(req, res, next) {
  const logQuery = JSON.stringify(req.query)
  req.logger.info(`Querying auction average stats: ${logQuery}`)

  const average = {}
  const { from, to, days } = req.query
  const buyQuery = {
    'metaData.event': 'LogAuctionFundsIn',
    'metaData.timestamp': { $gt: from, $lt: to }
  }

  Promise.all([
    req.model('Event').countDocuments(buyQuery),
    auctionsStats.getAverageClosingPrice(req.model('Event'), req.query),
    auctionsStats.getAverageAuctionDuration(req.model('Event'), req.query)
  ]).then(([txnCount, closingPrice, auctionDuration]) => {
    average.auctionDuration = auctionDuration
    average.closingPrice = closingPrice
    average.transactionCount = Math.ceil(txnCount / days)

    req.logger.verbose('Sending auction average stats to client')
    res.send({ average })
  }).catch(error => next(error))

}

function converter(req, res, next) {
  const logQuery = JSON.stringify(req.query)
  req.logger.info(`Querying converter stats: ${logQuery}`)
  req.query.days = 1 // to support total calculation, not average

  Promise.all([
    marketData.getRate('ethereum'),
    statusData(),
    converterStats.conversions(req.model('Event'), req.query)
  ]).then(([rate, status, conversions]) => {
    // We do not want to show average price on general/total stats
    delete conversions.eth.price
    delete conversions.usd.price

    const currentPrice = new BigNumber(status.currentConverterPrice)
      .dividedBy(1e18)
    const price = {}
    price.eth = currentPrice.toFixed(18)
    price.usd = currentPrice.multipliedBy(rate).toFixed(2)

    const available = {}
    available.eth = new BigNumber(status.availableEth).dividedBy(1e18)
    available.met = new BigNumber(status.availableMet).dividedBy(1e18)

    req.logger.verbose('Sending converter stats to client')
    res.send({ current: { price, available }, conversions })
  }).catch(err => next(err))
}

function converterAverage(req, res, next) {
  const logQuery = JSON.stringify(req.query)
  req.logger.info(`Querying converter average stats: ${logQuery}`)

  converterStats.conversions(req.model('Event'), req.query)
    .then(conversions => {
      req.logger.verbose('Sending conveter average stats to client')
      res.send({ average: conversions })
    }).catch(err => next(err))
}

router.get('/', metStats)
router.get('/auction', parseFromTo, auction)
router.get('/auction/average', parseFromTo, auctionAverage)
router.get('/acc', parseFromTo, converter)
router.get('/acc/average', parseFromTo, converterAverage)

module.exports = router
