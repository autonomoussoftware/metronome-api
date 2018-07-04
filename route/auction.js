'use strict'

const Router = require('express').Router

function createRouter (metApi) {
  const router = new Router()

  function getStatus (req, res, next) {
    if (!metApi.auctionStatus) {
      next(new Error('API not initialized'))
      return
    }

    metApi.auctionStatus.getStatus()
      .then(status => res.json(status.auction))
      .catch(next)
  }

  router.get('/', getStatus)

  return router
}

module.exports = createRouter
