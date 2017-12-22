const Router = require('express').Router
const router = new Router()

router.get('/', queryAccounts)
router.get('/:address', findAccountByAddress)

function queryAccounts (req, res, next) {
  req.logger.info('Querying accounts', req.query)

  req.model('Account').countAndFind(req.query)
    .skip(req.skip)
    .limit(req.limit)
    .sort(req.sort)
    .lean()
    .exec((err, accounts, count) => {
      if (err) { return next(err) }

      req.logger.verbose('Sending accounts to client')
      res.send({ accounts, count })
    })
}

function findAccountByAddress (req, res, next) {
  req.logger.info(`Finding account with address ${req.params.address}`)

  req.model('Account').findById(req.params.address)
    .then((account) => {
      if (!account) { return res.status(404).end() }

      req.logger.verbose('Sending account to client')
      return res.send(account)
    })
    .catch(err => next(err))
}

module.exports = router
