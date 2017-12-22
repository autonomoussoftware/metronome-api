const milieu = require('milieu')

const config = milieu('mtn', {
  server: {
    maxResultsLimit: 1000,
    port: 3000
  },

  mongo: {
    url: 'mongodb://localhost/mtn',
    testUrl: 'mongodb://localhost/mtn-test'
  },

  logger: {
    sentry: {
      dsn: ''
    },
    console: {
      level: 'debug',
      timestamp: true,
      handleExceptions: true,
      humanReadableUnhandledException: true,
      colorize: true
    }
  },

  eth: {
    ipcPath: `${process.env['HOME']}/Library/Ethereum/geth.ipc`,
    webSocketUrl: 'ws://localhost:8546',
    tokenAddress: '0x7cb6622385665e7f6b7d2a7059972df922cb76f8',
    auctionAddress: '0x151d91d3f7a4a1be0a9efc03a878f8fdc8f0b772',
    exportStartBlock: 0
  }
})

module.exports = config
