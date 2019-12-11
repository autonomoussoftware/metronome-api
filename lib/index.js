'use strict'

const { promisify } = require('util')

const Server = require('./server')
const Socket = require('./socket')
const EthApi = require('./eth-api')
const Database = require('./database')
const logger = require('../logger')
const TokenExporter = require('./metronome/token-exporter')
const ACCExporter = require('./metronome/acc-exporter')
const AuctionExporter = require('./metronome/auction-exporter')
const Status = require('./metronome/status')
const StatusCollector = require('./metronome/status-collector')
const config = require('config')
class MetApi {
  constructor () {
    this.logger = logger
    this.isRunning = false
    this.config = config
    this.database = new Database(config, this.logger)
    this.server = new Server(config, this.logger, this.database, this)
    this.socket = new Socket(config, this.logger, this.server.httpServer)
    if (config.eth.enabled) {
      this.ethApi = new EthApi(config.eth, this.logger, () => this._initMetronome())
    }
  }

  _initMetronome () {
    this.tokenExporter = new TokenExporter(this.database, this.ethApi, this.socket)
    this.accExporter = new ACCExporter(this.database, this.ethApi, this.socket)
    this.auction = new AuctionExporter(this.database, this.ethApi, this.socket)
    this.status = new Status({
      logger: this.logger,
      db: this.database,
      ethApi: this.ethApi,
      socket: this.socket
    })
    this.statusCollector = StatusCollector.start()
  }

  start () {
    if (this.isRunning) { throw new Error('Can not start met-api because it is already running') }

    this.isRunning = true
    this.logger.verbose('Starting met-api...')

    return this.database.connect()
      .then(() => {
        this.server.listen(err => {
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
    if (!this.isRunning) { throw new Error('Can not stop met-api because it is already stopping') }

    this.isRunning = false
    this.logger.verbose('Stopping met-api...')

    const serverCloseAsync = promisify(this.server.close.bind(this.server))

    return Promise.all([
      serverCloseAsync(),
      this.database.disconnect()
    ])
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