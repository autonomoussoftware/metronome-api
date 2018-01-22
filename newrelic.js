const config = require('./config')

exports.config = {
  app_name: config.newrelic.licenseKey,
  license_key: config.newrelic.licenseKey,
  logging: { level: 'info' }
}
