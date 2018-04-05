const config = require('config')

config.logger = {}
config.port = 9000
config.eth.enabled = false
config.mongo.url = config.mongo.testUrl

module.exports = config
