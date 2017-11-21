const Router = require('express').Router
const router = new Router()

router.get('/', queryEvents)
router.get('/:id', findBalanceByAddress)

function queryEvents (req, res, next) {
  req.logger.info('Querying balances', req.query)

  req.model('Balance').countAndFind(req.query)
    .skip(req.skip)
    .limit(req.limit)
    .sort(req.sort)
    .lean()
    .exec((err, balances, count) => {
      if (err) { return next(err) }

      req.logger.verbose('Sending balances to client')
      res.send({ balances, count })
    })
}

function findBalanceByAddress (req, res, next) {
  req.logger.info(`Finding balance with address ${req.params.address}`)

  req.model('Balance').findById(req.params.address)
    .then((balance) => {
      if (!balance) { return res.status(404).end() }

      req.logger.verbose('Sending balance to client')
      return res.send(balance)
    })
    .catch(err => next(err))
}

module.exports = router
