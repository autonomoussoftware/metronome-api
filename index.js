const config = require('./config')

if (config.newrelic.licenseKey) {
  require('newrelic')
}

const logger = require('./logger')
const MtnApi = require('./lib')


module.exports = new MtnApi(config, logger)
