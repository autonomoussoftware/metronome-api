const config = require('./config')
require('newrelic')

const logger = require('./logger')
const MtnApi = require('./lib')


module.exports = new MtnApi(config, logger)
