'use strict'

const io = require('socket.io')

const events = {
  AUCTION_STATUS_TASK: 'AUCTION_STATUS_TASK',
  NEW_EVENT: 'NEW_EVENT',
  LATEST_BLOCK: 'LATEST_BLOCK',
  BALANCE_UPDATED: 'BALANCE_UPDATED'
}

class Socket {
  constructor (config, logger, httpServer) {
    this.config = config
    this.logger = logger
    this.io = io(httpServer)

    this.io.on('connection', socket => {
      this.logger.info(`New socket connection with client: ${socket.id}`)
    })

    this.events = events
  }
}

module.exports = Socket
