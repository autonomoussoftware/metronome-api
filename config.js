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
    webSocketUrl: 'ws://localhost:8546',
    tokenAddress: '0x825a2ce3547e77397b7eac4eb464e2edcfaae514',
    auctionAddress: '0x9aeb1035b327f4f81198090f4183f21ca6fcb040',
    exportStartBlock: 0,
    tokenDecimals: 18
  }
})

module.exports = config
