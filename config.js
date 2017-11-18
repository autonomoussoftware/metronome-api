const milieu = require('milieu')

const config = milieu('mtn', {
  server: {
    maxResultsLimit: 1000,
    port: 3000
  },

  mongo: {
    url: 'mongodb://localhost/lkm',
    testUrl: 'mongodb://localhost/lkm-test'
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
  }
})

module.exports = config
