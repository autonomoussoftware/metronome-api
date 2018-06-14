'use strict'

const Router = require('express').Router

const logger = require('../logger')
const db = require('../lib/stats-db')

const router = new Router()

function getHistoricalData (req, res, next) {
  const { from, to } = req.query

  try {
    const end = Number.parseInt(to || (Date.now() / 1000))
    const start = Number.parseInt(from || (end - 3600))

    db.getData(start, end)
      .then(function (data) {
        logger.verbose('<--', from, to, data.length)
        res.json(data)
      })
      .catch(next)
  } catch (err) {
    next(err)
  }
}

router.get('/', getHistoricalData)

module.exports = router
