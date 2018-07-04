'use strict'

const io = require('socket.io')

const events = {
  AUCTION_STATUS_TASK: 'AUCTION_STATUS_TASK',
  BALANCE_UPDATED: 'BALANCE_UPDATED',
  LATEST_BLOCK: 'LATEST_BLOCK',
  NEW_EVENT: 'NEW_EVENT',
  STATUS_UPDATED: 'status-updated'
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
