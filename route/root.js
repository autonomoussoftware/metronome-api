'use strict'

const pkg = require('../package')
const Router = require('express').Router
const router = new Router()

function getRoot (req, res) {
  req.logger.verbose('Responding to root request')
  req.logger.verbose('Sending response to client')

  res.send({ name: pkg.name, version: pkg.version })
}

function getStatus (req, res, next) {
  req.logger.verbose('Responding to status request')
  req.pingDatabase()
    .then(result => {
      if (!result || !result.ok) { return res.sendStatus(503) }

      req.logger.verbose('Sending status to client')
      res.sendStatus(204)
    })
    .catch(err => next(err))
}

router.get('/', getRoot)
router.get('/status', getStatus)

module.exports = router
