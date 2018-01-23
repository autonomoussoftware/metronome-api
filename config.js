const milieu = require('milieu')

const config = milieu('mtn', {
  server: {
    maxResultsLimit: 1000,
    port: process.env.PORT || 3000
  },

  cors: {
    origin: '*'
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
    },

    papertrail: {
      port: '',
      host: '',
      inlineMeta: true
    }
  },

  newrelic: {
    licenseKey: '',
    appName: 'metronome-api'
  },

  eth: {
    enabled: true,
    ipcPath: `${process.env['HOME']}/Library/Ethereum/geth.ipc`,
    webSocketUrl: 'ws://parity.bloqrock.net:8546',
    tokenAddress: '0x02d0f0275244938bac719caa2621da17c503e347',
    auctionAddress: '0xf657ced37343dbc441977678edae66fe0fdac5a1',
    exportStartBlock: 0,
    tokenDecimals: 18
  }
})

module.exports = config
