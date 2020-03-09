'use strict'
const fetch = require('node-fetch')
const logger = require('../logger')

function getMarketData(assetName) {
  return fetch(`https://api.coincap.io/v2/assets/${assetName}`)
    .then(res => res.json())
    .then(({ data }) => {
      if (data && data.symbol && data.priceUsd) {
        return {
          symbol: data.symbol,
          value: parseFloat(data.priceUsd, 10),
          supply: data.supply,
          marketCapUsd: data.marketCapUsd
        }
      }
    })
    .catch(err => {
      logger.error(`Could not get ${assetName} rate: `, err.message)
    })
}

function getRate(assetName) {
  return getMarketData(assetName).then(data => data.value)
}

module.exports = { getRate, getMarketData }