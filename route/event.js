const Router = require('express').Router
const router = new Router()

router.get('/', queryEvents)
router.get('/:id', findEventById)

function queryEvents (req, res, next) {
  req.logger.info('Querying events', req.query)

  req.model('Event').countAndFind(req.query)
    .skip(req.skip)
    .limit(req.limit)
    .sort(req.sort)
    .lean()
    .exec((err, events, roleCount) => {
      if (err) { return next(err) }

      req.logger.verbose('Sending events to client')
      res.sendQueried(events, roleCount)
    })
}

function findEventById (req, res, next) {
  req.logger.info(`Finding event with id ${req.params.id}`)

  req.model('Event').findById(req.params.id, (err, event) => {
    if (err) { return next(err) }
    if (!event) { return res.status(404).end() }

    req.logger.verbose('Sending event to client')
    return res.sendFound(event)
  })
}

module.exports = router
