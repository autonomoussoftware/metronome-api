const config = require('./config')

exports.config = {
  app_name: [config.newrelic.app_name],
  license_key: config.newrelic.licenseKey,
  logging: { level: 'info' }
}
