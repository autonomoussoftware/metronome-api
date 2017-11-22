const Router = require('express').Router
const router = new Router()

router.get('/', queryEvents)
router.get('/account/:address', findEventsByAccount)
router.get('/:id', findEventById)

function queryEvents (req, res, next) {
  req.logger.info(`Querying events: ${JSON.stringify(req.query)}`)

  console.log(req.query)

  req.model('Event').countAndFind(req.query)
    .skip(req.skip)
    .limit(req.limit)
    .sort(req.sort)
    .lean()
    .exec((err, events, count) => {
      if (err) { return next(err) }

      req.logger.verbose('Sending events to client')
      res.send({ events, count })
    })
}

function findEventById (req, res, next) {
  req.logger.info(`Finding event with id ${req.params.address}`)

  req.model('Event').findById(req.params.address)
    .then((event) => {
      if (!event) { return res.status(404).end() }

      req.logger.verbose('Sending event to client')
      return res.send(event)
    })
    .catch(err => next(err))
}

function findEventsByAccount (req, res, next) {
  req.logger.info(`Finding events with account ${req.params.address}`)

  const query = { $or: [
    { 'metaData.returnValues._from': req.params.address },
    { 'metaData.returnValues._to': req.params.address }
  ]}

  console.log(query)

  req.model('Event').countAndFind(query)
    .skip(req.skip)
    .limit(req.limit)
    .sort(req.sort)
    .lean()
    .exec((err, events, count) => {
      if (err) { return next(err) }

      req.logger.verbose('Sending events to client')
      return res.send({ events, count })
    })
}

module.exports = router
