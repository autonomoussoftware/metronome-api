const beforeExit = require('before-exit')

const config = require('config')
const logger = require('./logger')
const MtnApi = require('./lib')

if (config.newRelic.apiKey) {
  require('newrelic')
}

const loggeableConfig = Object.assign({}, config)
delete loggeableConfig.__$

logger.info('API is starting', loggeableConfig)

beforeExit.do(function (signal) {
  logger.error('Shutting down API on signal', signal)
})

module.exports = new MtnApi(config, logger)
