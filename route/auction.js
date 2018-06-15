'use strict'

const Router = require('express').Router

function createRouter (metApi) {
  const router = new Router()

  function getStatus (req, res, next) {
    if (!metApi.auctionStatus) {
      next(new Error('API not initialized'))
      return
    }

    metApi.auctionStatus.getAuctionStatus()
      .then(status => res.json(status))
      .catch(next)
  }

  router.get('/', getStatus)

  return router
}

module.exports = createRouter
