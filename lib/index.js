const Server = require('./server')
const Socket = require('./socket')
const EthApi = require('./eth-api')
const Database = require('./database')

const TokenExporter = require('./metronome/token-exporter')
const AuctionStatus = require('./metronome/auction-status')

class MetApi {
  constructor (config, logger) {
    this.logger = logger.child({ context: 'met-api' })

    this.isRunning = false
    this.config = config
    this.database = new Database(config, this.logger)
    this.server = new Server(config, this.logger, this.database)
    this.socket = new Socket(config, this.logger, this.server.httpServer)

    if (config.eth.enabled) {
      this.ethApi = new EthApi(config.eth)
      this.tokenExporter = new TokenExporter(config.eth, this.logger, this.database, this.ethApi, this.socket)
      this.auctionStatus = new AuctionStatus(this.logger, this.database, this.ethApi, this.socket)
    }
  }

  start () {
    if (this.isRunning) {
      throw new Error('Can not start met-api because it is already running')
    }

    this.isRunning = true

    this.logger.verbose('Starting met-api...')

    return this.database.connect()
      .then(() => {
        this.server.listen((err) => {
          if (err) { throw new Error(err) }

          this.logger.verbose('Start completed, met-api is ready and awaiting requests')
        })
      })
      .catch(err => {
        this.logger.error(`Error starting met-api: ${err}`)
        throw new Error(err)
      })
  }

  stop () {
    if (!this.isRunning) {
      throw new Error('Can not stop met-api because it is already stopping')
    }

    this.isRunning = false

    this.logger.verbose('Stopping met-api...')
    return this.database.disconnect()
      .then(() => {
        this.logger.verbose('Stop completed, met-api has closed all connections and successfully halted')
      })
      .catch(err => {
        this.logger.error(`Error stopping met-api: ${err}`)
        throw new Error(err)
      })
  }
}

module.exports = MetApi
