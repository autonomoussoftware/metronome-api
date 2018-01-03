const pkg = require('../package')
const Router = require('express').Router
const router = new Router()

router.get('/', getRoot)
router.get('/config', getConfig)
router.get('/status', getStatus)

function getRoot (req, res) {
  req.logger.verbose('Responding to root request')
  req.logger.verbose('Sending response to client')

  res.send({ name: pkg.name, version: pkg.version })
}

function getConfig (req, res, next) {
  req.logger.verbose('Responding to config request')
  req.logger.verbose('Sending config to client')

  res.send(req.config.eth)
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

module.exports = router
