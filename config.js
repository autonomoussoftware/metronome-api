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
    webSocketUrl: 'ws://localhost:8545',
    tokenAddress: '0x0ba316eb45232779903964f472799be12dff7a64',
    exportStartBlock: 0
  }
})

module.exports = config
