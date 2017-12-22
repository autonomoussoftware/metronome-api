const config = require('./config')
const logger = require('./logger')
const MtnApi = require('./lib')

module.exports = new MtnApi(config, logger)
