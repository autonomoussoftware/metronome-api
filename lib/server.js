'use strict'

const http = require('http')
const cors = require('cors')
const express = require('express')
const prettyMs = require('pretty-ms')
const onFinished = require('on-finished')
const expressRest = require('express-rest-api')
const expressBodyParser = require('body-parser')

const rootRouter = require('../route/root')
const eventRouter = require('../route/event')
const accountRouter = require('../route/account')
const historyRouter = require('../route/history')
const auctionRouter = require('../route/auction')
const dashboardRouter = require('../route/dashboard')
const accRouter = require('../route/acc')

class Server {
  // eslint-disable-next-line max-params
  constructor (config, logger, database, metApi) {
    this.config = config
    this.logger = logger
    this.database = database
    this.metApi = metApi

    this.logger.verbose('Creating express app and HTTP server instance')
    this.expressApp = express()
    this.httpServer = http.createServer(this.expressApp)
    this.logger.verbose('Express app and HTTP server instance created')

    this._setupExpressMiddleware()
    this._setupExpressRoutes()
    this._setupErrorHandler()
  }

  listen (cb) {
    this.logger.verbose(
      'Attempting to bind HTTP server to :%s port',
      this.config.port
    )
    this.httpServer.listen(this.config.port, err => {
      if (err) {
        return cb(err)
      }

      this.logger.verbose('HTTP server bound')
      cb(null)
    })
  }

  close (cb) {
    this.httpServer.close(cb)
  }

  _setupExpressMiddleware () {
    this.expressApp.request.config = this.config
    this.expressApp.request.model = (...args) => this.database.model(...args)
    this.expressApp.request.pingDatabase = (...args) =>
      this.database.ping(...args)
    this.expressApp.request.api = this.api

    const createReqLogger = (req, res, next) => {
      req._startTime = Date.now()
      req.logger = this.logger

      req.logger.verbose('Incoming request', {
        httpVersion: req.httpVersion,
        method: req.method,
        url: req.url,
        trailers: req.trailers
      })

      onFinished(res, () => {
        req.logger.verbose('Outgoing response', {
          httpVersion: req.httpVersion,
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration: prettyMs(Date.now() - req._startTime)
        })
      })

      next(null)
    }

    const injectionChecker = (req, res, next) => {
      delete req.query.$where

      const HTML_REGEX = /(<([^>]+)>)/ig
      Object.keys(req.query).forEach(k => {
        if (k.match(HTML_REGEX)) {
          return res.send(400)
        }
      })

      next(null)
    }

    this.logger.verbose('Attaching middleware to express app')

    this.expressApp.use(createReqLogger)
    this.expressApp.use(cors(this.config.cors))
    this.expressApp.use(expressBodyParser.raw())
    this.expressApp.use(expressBodyParser.json())

    this.expressApp.use(
      expressRest({
        resourceId: '_id',
        maxResultsLimit: this.config.server.maxResultsLimit
      })
    )

    this.expressApp.use(injectionChecker)

    this.logger.verbose('Middleware attached')
  }

  _setupExpressRoutes () {
    this.logger.verbose('Attaching resource routers to express app')
    this.expressApp.use('/', rootRouter)
    this.expressApp.use('/event', eventRouter)
    this.expressApp.use('/account', accountRouter)
    this.expressApp.use('/history', historyRouter)
    this.expressApp.use('/auction', auctionRouter(this.metApi))
    this.expressApp.use('/dashboard', dashboardRouter)
    this.expressApp.use('/acc', accRouter(this.metApi))
    this.logger.verbose('Resource routers attached')
  }

  _setupErrorHandler () {
    this.logger.verbose('Attaching error handler')
    this.expressApp.use((err, req, res, next) => { // eslint-disable-line max-params, no-unused-vars
      err.statusCode || (err.statusCode = Server.statusCodeByErrorName[err.name] || 500)
      req.logger.error(err.toString(), err)
      req.logger.verbose('Responding to client', err.toString())
      res.status(err.statusCode).send(err.toString())
    })
    this.logger.verbose('Error handler attached')
  }
}

Server.statusCodeByErrorName = {
  ValidationError: 400,
  CastError: 400
}

module.exports = Server
