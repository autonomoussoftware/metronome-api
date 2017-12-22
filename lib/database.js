const Mongoose = require('mongoose').Mongoose
const mongooseTimestamp = require('mongoose-cu-timestamps')
const mongooseCountAndFind = require('mongoose-count-and-find')

const eventSchema = require('../schema/event')
const accountSchema = require('../schema/account')

class Database {
  constructor (config, logger) {
    this.config = config
    this.logger = logger.child({ context: 'Database' })

    this.logger.verbose('Creating mongoose instance')
    this.mongoose = new Mongoose()
    this.mongoose.Promise = Promise
    this.logger.verbose('Mongoose instance created')

    this._setupMongoosePlugins()
    this._setupMongooseModels()
  }

  connect () {
    this.logger.verbose('Connecting to database')
    const opts = { useMongoClient: true, promiseLibrary: Promise }

    return this.mongoose.connect(this.config.mongo.url, opts)
      .then(() => this.logger.verbose('Connected to database'))
  }

  disconnect () {
    this.logger.verbose('Disconnecting from database')

    return this.mongoose.disconnect()
      .then(() => this.logger.verbose('Disconnected from database'))
  }

  model (...args) {
    return this.mongoose.model(...args)
  }

  ping (cb) {
    if (!this.mongoose.connection.db) {
      return cb(new Error('Not connected to database'))
    }

    return this.mongoose.connection.db.admin().ping()
  }

  _setupMongoosePlugins () {
    this.logger.verbose('Attaching plugins')
    this.mongoose.plugin(mongooseTimestamp)
    this.mongoose.plugin(mongooseCountAndFind)
    this.logger.verbose('Plugins attached')
  }

  _setupMongooseModels () {
    this.logger.verbose('Registering models')
    this.mongoose.model('Event', eventSchema)
    this.mongoose.model('Account', accountSchema)
    this.logger.verbose('Models registered')
  }
}

module.exports = Database
