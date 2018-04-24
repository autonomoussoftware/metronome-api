const beforeExit = require('before-exit')

const config = require('config')

if (config.newrelic && config.newrelic.licenseKey) {
  require('newrelic')
}

const logger = require('./logger')
const MetApi = require('./lib')

const loggeableConfig = Object.assign({}, config)
delete loggeableConfig.__$

logger.info('API is starting', loggeableConfig)

beforeExit.do(function (signal) {
  logger.error('Shutting down API on signal', signal)
})

module.exports = new MetApi(config, logger)
