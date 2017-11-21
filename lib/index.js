const Server = require('./server')
const Socket = require('./socket')
const EthApi = require('./eth-api')
const Exporter = require('./exporter')
const Database = require('./database')

class MtnApi {
  constructor (config, logger) {
    this.logger = logger.child({ context: 'mtn-api' })

    this.isRunning = false
    this.config = config

    this.ethApi = new EthApi(config.eth)
    this.database = new Database(config, this.logger)
    this.server = new Server(config, this.logger, this.database)
    this.socket = new Socket(config, this.logger, this.server.httpServer)
    this.exporter = new Exporter(config.eth, this.logger, this.database, this.ethApi, this.socket.io)
  }

  start () {
    if (this.isRunning) {
      throw new Error('Can not start mtn-api because it is already running')
    }

    this.isRunning = true

    this.logger.verbose('Starting mtn-api...')

    return this.database.connect()
      .then(() => {
        this.server.listen((err) => {
          if (err) { throw new Error(err) }

          this.logger.verbose('Start completed, mtn-api is ready and awaiting requests')
        })
      })
  }

  stop () {
    if (!this.isRunning) {
      throw new Error('Cannot stop mtn-api because it is already stopping')
    }

    this.isRunning = false

    this.logger.verbose('Stopping mtn-api...')
    return this.database.disconnect()
      .then(() => {
        this.logger.verbose('Stop completed, mtn-api has closed all connections and successfully halted')
      })
  }
}

module.exports = MtnApi
