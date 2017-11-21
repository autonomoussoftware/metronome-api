const io = require('socket.io')

class Socket {
  constructor (config, logger, httpServer) {
    this.config = config
    this.logger = logger
    this.io = io(httpServer)

    this.io.on('connection', (socket) => {
      this.logger.info(`New socket connection with client: ${socket.id}`)
    })
  }
}

module.exports = Socket
