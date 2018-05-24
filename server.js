'use strict'

const beforeExit = require('before-exit')
const config = require('config')

if (config.newRelic.licenseKey) {
  require('newrelic')
}

const logger = require('./logger')
const MetApi = require('./lib')

const loggeableConfig = Object.assign({}, config)
delete loggeableConfig.__$

logger.info('API is starting', loggeableConfig)

const metApi = new MetApi(config, logger)

beforeExit.do(function (signal) {
  logger.error('Shutting down API on signal', signal)
  return metApi.stop()
})

metApi.start()
  .then(function () {
    logger.info(`Listening for HTTP requests 🚀 🔥`)
  })
  .catch(function (err) {
    logger.error(`Could not start API: ${err.message}`)
    process.exit(1)
  })
