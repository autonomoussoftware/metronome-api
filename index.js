const config = require('./config')
const logger = require('./logger')
const MtnApi = require('./lib')

if (config.newrelic.licenseKey) {
  require('newrelic')
}

const loggeableConfig = Object.assign({}, config)
delete loggeableConfig.__$
logger.info('API is starting', loggeableConfig)


module.exports = new MtnApi(config, logger)
