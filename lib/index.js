const Database = require('./database')
const Server = require('./server')
const Exporter = require('./exporter')
const Api = require('./api')

class MtnApi {
  constructor (config, logger) {
    this.api = new Api(config.eth)

    this.isRunning = false
    this.config = config
    this.logger = logger.child({ context: 'mtn-api' })
    this.database = new Database(config, this.logger)
    this.server = new Server(config, this.logger, this.database, this.api)
    this.exporter = new Exporter(config.eth, this.logger, this.database, this.api)
  }

  start () {
    if (this.isRunning) {
      throw new Error('Cannot start mtn-api because it is already running')
    }

    this.isRunning = true

    this.logger.verbose('Starting mtn-api')
    this.logger.verbose('Compiling Vault secrets into config')

    return this.database.connect()
      .then(() => {
        this.logger.verbose('mtn-api ready and awaiting requests')
        this.server.listen(() => {
          // cb(null, { url: this.config.server.url })
        })
      })
  }

  stop () {
    if (!this.isRunning) {
      throw new Error('Cannot stop mtn-api because it is already stopping')
    }

    this.isRunning = false

    this.logger.verbose('Stopping mtn-api')
    return this.database.disconnect()
      .then(() => {
        this.logger.verbose('mtn-api has closed all connections and successfully halted')
      })
  }
}

module.exports = MtnApi
