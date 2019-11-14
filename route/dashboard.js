'use strict'

const Router = require('express').Router
const marketData = require('../lib/market-data')
const db = require('../lib/stats-db')
const converterStats = require('./stats/converter-stats')
const auctionsStats = require('./stats/auction-stats')
const moment = require('moment-timezone')
const config = require('config')
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
        query.days = Math.ceil(toDate.diff(fromDate, 'minutes') / 1440) // 1440 minutes in a day

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
    ]).then(([rate, { symbol, value, marketCapUsd, supply }, status, totalMetHolders]) => {
        const price = {}
        price.eth = value / rate
        price.usd = value

        const stats = {}
        stats.symbol = symbol
        stats.price = price
        stats.marketCapUsd = marketCapUsd
        stats.totalSupply = Math.round(status.totalMET / 1e18)
        stats.circulatingSupply = supply
        stats.proceeds = Math.round(status.proceedsBal / 1e18)
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
    ]).then(([rate, data, buyerCount, { lastOpeningPrice, lastClosingPrice }]) => {
        const currentPrice = {}
        currentPrice.eth = data.currentAuctionPrice / 1e18
        currentPrice.usd = currentPrice.eth * rate

        const price = {}
        price.currentPrice = currentPrice
        price.lastOpeningPrice = lastOpeningPrice
        price.lastClosingPrice = lastClosingPrice

        const stats = {}
        stats.price = price
        stats.availability = data.minting
        stats.totalAuctions = data.currAuction

        const nextMidnight = moment().startOf('day').add(1, 'day')
        stats.timeRemaining = nextMidnight.diff(moment(), 'seconds')

        stats.buyer = buyerCount

        req.logger.verbose('Sending auction stats to client')
        res.send(stats)
    }).catch(err => next(err))
}

function auctionAverage(req, res, next) {
    const logQuery = JSON.stringify(req.query)
    req.logger.info(`Querying auction average stats: ${logQuery}`)

    const average = {}
    const { from, to, days } = req.query
    const buyQuery = { 'metaData.event': 'LogAuctionFundsIn', 'metaData.timestamp': { $gt: from, $lt: to } }

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
        delete conversions.eth.price // We do not want to show average price on general/total stats
        delete conversions.usd.price

        const price = {}
        price.eth = status.currentConverterPrice / 1e18
        price.usd = price.eth * rate

        const available = {}
        available.eth = status.availableEth / 1e18
        available.met = status.availableMet / 1e18

        req.logger.verbose('Sending converter stats to client')
        res.send({ current: { price, available }, conversions })
    }).catch(err => next(err))
}

function converterAverage(req, res, next) {
    const logQuery = JSON.stringify(req.query)
    req.logger.info(`Querying converter average stats: ${logQuery}`)

    converterStats.conversions(req.model('Event'), req.query).then(conversions => {
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
