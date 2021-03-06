'use strict'

const Router = require('express').Router
const config = require('config')
const converter = require('./market/converter')
const moment = require('moment-timezone')

function accRouter(metApi) {
  const router = new Router()

  function parseQuoteParams(req, res, next) {
    const { amount, side } = req.query
    try {
      if (!amount || !side) {
        throw new Error('Param \'amount\' and \'side\' are required.')
      }
      if (side.toUpperCase() !== 'BUY' && side.toUpperCase() !== 'SELL') {
        throw new Error('Only \'buy\' and \'sell\' are allowed as value for \'side\'.')
      }
      req.query.side = side.toUpperCase()
      next()
    } catch (error) { next(error) }
  }

  function parseTradeParams(req, res, next) {
    const { query } = req
    try {
      query.to = Number.parseInt(query.to || (Date.now() / 1000))
      query.from = Number.parseInt(query.from || config.eth.birthTime)
      query.limit = query.limit && query.limit <= 1000 ? Number.parseInt(query.limit) : 100
      next()
    } catch (error) {
      next(error)
    }
  }

  function parseTransactionParams(req, res, next) {
    const { amount, minReturn, priority, side, userAddress } = req.query
    try {
      if (!amount || !minReturn || !priority || !side || !userAddress) {
        throw new Error('Param \'amount\', \'minReturn\', \'priority\', \'side\' and \'userAddress\' are required.')
      }
      if (side.toUpperCase() !== 'BUY' && side.toUpperCase() !== 'SELL') {
        throw new Error('Only Buy and Sell are allowed as value for \'side\'.')
      }
      if(!['LOW', 'MEDIUM', 'HIGH'].includes(priority.toUpperCase())){
        throw new Error('Only Low, Medium and High are allowed as value for \'priority\'.')
      }
      req.query.side = side.toUpperCase()
      req.query.priority = priority.toUpperCase()
      next()
    } catch (error) { next(error) }
  }

  function parseVolumeParams(req, res, next) {
    moment.tz.setDefault('GMT')
    const { query } = req
    try {
      query.limit = Number.parseInt(query.limit || 30)
      query.from = moment().startOf('day').subtract(query.limit, 'days').unix()
      query.to = moment().startOf('day').unix()
      next()
    } catch (error) { next(error) }
  }

  function accData(req, res, next) {
    // We can add some other detail to this endpoint
    next()
  }

  function orderBook(req, res, next) {
    const acc = metApi.ethApi.metronomeContracts.AutonomousConverter
    converter.getOrderBook(acc)
      .then(response => res.send(response))
      .catch(error => next(error))
  }

  function ticker(req, res, next) {
    const logQuery = JSON.stringify(req.query)
    req.logger.info(`Querying MET ACC ticker: ${logQuery}`)

    const from = moment().subtract(24, 'hours').unix()
    const to = moment().unix()

    Promise.all([
      converter.getPrices(req.model('Event'), { from, to }),
      converter.getVolume24(req.model('Event'), { from, to })
    ]).then(([{ highPrice, lowPrice, openPrice, lastPrice }, volume]) => {
      const data = {}
      data.name = 'Metronome'
      data.symbol = 'MET'
      data.decimals = 18
      data.open = openPrice
      data.high = highPrice
      data.low = lowPrice
      data.last = lastPrice
      data.volume = volume
      data.displayCurrency = 'ETH'

      req.logger.verbose('Sending MET ACC ticker data to client')
      res.send(data)
    }).catch(error => next(error))

  }

  function historicalVolumes(req, res, next) {
    const logQuery = JSON.stringify(req.query)
    req.logger.info(`Querying MET ACC historical volumes: ${logQuery}`)

    converter.getVolumes(req.model('Event'), req.query)
      .then(data => {
        const sort = req.query.sort
        if (sort && sort.toUpperCase() === 'ASC') {
          data.sort((a, b) => (a.timestamp > b.timestamp) ? 1 : -1)
        }

        req.logger.verbose('Sending MET ACC historical volumes to client')
        res.send({ displayCurrency: 'ETH', volumes: data })
      })
      .catch(error => next(error))
  }

  function quote(req, res, next) {
    const logQuery = JSON.stringify(req.query)
    req.logger.info(`Querying quote amount for trade: ${logQuery}`)

    const acc = metApi.ethApi.metronomeContracts.AutonomousConverter
    converter.getQuote(acc, req.query)
      .then(data => {
        res.send({ quote: data })
      })
      .catch(error => next(error))
  }

  function trades(req, res, next) {
    const logQuery = JSON.stringify(req.query)
    req.logger.info(`Querying MET ACC trades: ${logQuery}`)

    converter.getTradeData(req.model('Event'), req.query)
      .then(data => {
        const sort = req.query.sort
        if (sort && sort.toUpperCase() === 'ASC') {
          data.sort((a, b) => (a.timestamp > b.timestamp) ? 1 : -1)
        }

        req.logger.verbose('Sending MET ACC trades to client')
        res.send({ displayCurrency: 'ETH', trades: data })
      })
      .catch(error => next(error))
  }

  async function transaction(req, res, next) {
    const logQuery = JSON.stringify(req.query)
    req.logger.info(`Querying transaction data for trade: ${logQuery}`)

    const acc = metApi.ethApi.metronomeContracts.AutonomousConverter
    converter.getTransaction(acc, metApi.ethApi.web3, req.query)
      .then(data => {
        res.send(data)
      })
      .catch(error => next(error))
  }

  router.get('/', accData, ticker)
  router.get('/orderbook', orderBook)
  router.get('/quote', parseQuoteParams, quote)
  router.get('/ticker', ticker)
  router.get('/trades', parseTradeParams, trades)
  router.get('/transaction', parseTransactionParams, transaction)
  router.get('/volumes', parseVolumeParams, historicalVolumes)
  return router
}
module.exports = accRouter