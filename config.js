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
    tokenAddress: '0xcd68235a0fa4c0d308041db793120f6bb8c944b3',
    auctionAddress: '0xbfcad8234b7044dd114d75aa547c646bdbf3959b',
    exportStartBlock: 0,
    tokenDecimals: 18
  }
})

module.exports = config
