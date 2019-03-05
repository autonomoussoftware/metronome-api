'use strict'

const Router = require('express').Router

const logger = require('../logger')
const db = require('../lib/stats-db')

const router = new Router()

function parseFromTo (req, res, next) {
  const { query } = req

  try {
    query.to = Number.parseInt(query.to || (Date.now() / 1000))
    query.from = Number.parseInt(query.from || (query.to - 3600))
    next()
  } catch (err) {
    next(err)
  }
}

const logResponse = (from, to) =>
  function (data) {
    logger.verbose('<--', from, to, data.length)
    return data
  }

const getHistoricalData = dbCall =>
  function (req, res, next) {
    const { from, to } = req.query

    dbCall(from, to)
      .then(logResponse(from, to))
      .then(res.json.bind(res))
      .catch(next)
  }

router.get('/', parseFromTo, getHistoricalData(db.getData))
router.get('/auction', parseFromTo, getHistoricalData(db.getAuctionData))
router.get('/converter', parseFromTo, getHistoricalData(db.getConverterData))

module.exports = router
