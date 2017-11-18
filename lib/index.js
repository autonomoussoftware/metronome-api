const Database = require('./database')
const Server = require('./server')

class MtnApi {
  constructor (config, logger) {
    this.config = config
    this.logger = logger.child({ context: 'mtn-api' })
    this.isRunning = false
    this.database = new Database(config, this.logger)
    this.server = new Server(config, this.logger, this.database)
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
    return this.database.disconnect(cb)
      .then(() => {
        this.logger.verbose('mtn-api has closed all connections and successfully halted')
        // cb(null)
      })
  }
}

module.exports = MtnApi
