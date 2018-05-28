'use strict'

const config = require('config')
exports.config = {
  app_name: ['metronome-api'],
  license_key: config.newRelic.licenseKey,

  logging: {
    level: config.newRelic.loggingLevel
  },

  allow_all_headers: true,
  attributes: {
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'request.headers.proxyAuthorization',
      'request.headers.setCookie*',
      'request.headers.x*',
      'response.headers.cookie',
      'response.headers.authorization',
      'response.headers.proxyAuthorization',
      'response.headers.setCookie*',
      'response.headers.x*'
    ]
  }
}
