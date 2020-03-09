'use strict'
const BigNumber = require('bignumber.js')
const config = require('config')
const fetch = require('node-fetch')
const moment = require('moment')

/**
 * Get gas price from ETH Gas Station based on provided priority
 * 
 * @param {string} priority Transaction priority.
 * @returns {number} Gas price based on provided priority.
 */
function getGasPrice(priority) {
  return fetch(config.eth.ethGasStationUrl)
    .then(res => res.json())
    .then(data => {
      if (data) {
        switch (priority) {
          case 'LOW':
            return data.average * 1e8 // in Wei
          case 'MEDIUM':
            return data.fast * 1e8
          case 'HIGH':
            return data.fastest * 1e8
        }
      }
    })
}

/**
 * Generate random number bwtween provided min and max
 * 
 * @param {number} min Lower limit, inclusive.
 * @param {number} max Upper limit, inclusive.
 * @returns {number} Random generated number
 */
function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


/**
 * @typedef {object} Ask Virtual Metronome ask.
 * @property {string} price Trade price of virtual ask.
 * @property {string} size Trade volume of virtual ask.
 */

/**
 * Calculate virtual Metronome asks.
 * 
 * Contract calling via Web3 has an issue, due to which we have to pass
 * string param instead of uint256 param.
 * https://github.com/ethereum/web3.js/issues/2077
 * 
 * @param {object} acc Autonomous Converter Contract instance.
 * @returns {Array.<Ask>} Virtual Metronome asks.
 */
async function calculateAsks(acc) {
  const asks = []
  for (let i = 0; i < 10; i++) {
    const randomNumber = `${random(1, 100)}.${random(1, 9999)}`
    const randomBN = new BigNumber(randomNumber)

    const met = randomBN.multipliedBy(1e18)
    const eth = await acc.methods.getEthForMetResult(met.toString()).call()

    const price = new BigNumber(eth).dividedBy(met).toFixed(18)
    const size = randomBN.toFixed(18)
    asks.push({ price, size })
  }

  return asks
}

/**
 * @typedef {object} Bid Virtual Metronome bid.
 * @property {string} price Trade price of virtual bid.
 * @property {string} size Trade volume of virtual bid.
 */

/**
 * Calculate virtual Metronome bids.
 * 
 * Contract calling via Web3 has an issue, due to which we have to pass
 * string param instead of uint256 param.
 * https://github.com/ethereum/web3.js/issues/2077
 * 
 * @param {object} acc Autonomous Converter Contract instance.
 * @returns {Array.<Bid>} Virtual Metronome bids.
 */
async function calculateBids(acc) {
  const bids = []

  for (let i = 0; i < 10; i++) {
    const randomNumber = random(1, 500)

    // Using 1e15, it will result in value ranging 0.001 to 0.5
    const eth = new BigNumber(randomNumber).multipliedBy(1e15)
    const met = await acc.methods.getMetForEthResult(eth.toString()).call()

    const price = eth.dividedBy(met).toFixed(18)
    const size = new BigNumber(met).dividedBy(1e18).toFixed(18)
    bids.push({ price, size })
  }

  return bids
}


/**
 * @typedef {object} OrderBook Virtual order book of Metronome.
 * @property {Array.<Ask>} ask Virtual Metronome asks.
 * @property {Array.<Bid>} bid Virtual Metronome bids.
 * @property {string} timestamp Current timestamp.
 */

/**
 * Get virtual order book of Metronome.
 * 
 * @param {object} acc Autonomous Converter Contract instance.
 * @returns {OrderBook} Virtual order book of Metronome.
 */
function getOrderBook(acc) {
  return Promise.all([
    calculateAsks(acc),
    calculateBids(acc)
  ]).then(([ask, bid]) => {

    ask.sort((a, b) => (Number.parseFloat(a.size) > Number.parseFloat(b.size)) ? 1 : -1)
    bid.sort((a, b) => (Number.parseFloat(a.size) > Number.parseFloat(b.size)) ? 1 : -1)
    const timestamp = new Date()
    return { timestamp, displayCurrency: 'ETH', ask, bid }
  })
}

/** 
 * @typedef {object} MetPrice
 * @property {string} highPrice High price during last 24 hours.
 * @property {string} lowPrice Low price during last 24 hours.
 * @property {string} openPrice Open price at the beginning of 24 hour period.
 * @property {string} lastPrice Last metronome trade price.
*/

/**
 * Get function for metronome prices during last 24 hours
 *
 * @param {object} model Mongo model to run query over database.
 * @param {object} params {from, to}. defines last 24 hours period.
 * @returns {MetPrice} Metronome trade price data.
 */
function getPrices(model, params) {
  const { from, to } = params
  const tradeQuery = {
    'metaData.timestamp': { $gt: from, $lt: to },
    '$or': [
      { 'metaData.event': 'ConvertEthToMet' },
      { 'metaData.event': 'ConvertMetToEth' }]
  }
  const groupExpression = {
    _id: null,
    max: {
      $max: {
        $divide: [{ $toDecimal: '$metaData.returnValues.eth' },
        { $toDecimal: '$metaData.returnValues.met' }]
      }
    },
    min: {
      $min: {
        $divide: [{ $toDecimal: '$metaData.returnValues.eth' },
        { $toDecimal: '$metaData.returnValues.met' }]
      }
    },
    ethOpen: { $first: '$metaData.returnValues.eth' },
    metOpen: { $first: '$metaData.returnValues.met' },
    ethLast: { $last: '$metaData.returnValues.eth' },
    metLast: { $last: '$metaData.returnValues.met' }
  }

  return model.aggregate()
    .match(tradeQuery)
    .group(groupExpression)
    .project('-_id max min ethOpen metOpen ethLast metLast')
    .then(trades => {
      if (!trades[0]) {
        return { highPrice: 0, lowPrice: 0, openPrice: 0, lastPrice: 0 }
      }
      const highPrice = new BigNumber(trades[0].max).toFixed(18)
      const lowPrice = new BigNumber(trades[0].min).toFixed(18)

      let eth = new BigNumber(trades[0].ethOpen)
      let met = new BigNumber(trades[0].metOpen)
      const openPrice = eth.dividedBy(met).toFixed(18)

      eth = new BigNumber(trades[0].ethLast)
      met = new BigNumber(trades[0].metLast)
      const lastPrice = eth.dividedBy(met).toFixed(18)

      return { highPrice, lowPrice, openPrice, lastPrice }
    })
}

/**
 * Get amount of ETH for buy/sell of MET.
 *
 * @param {object} acc Autonomous Converter Contract instance.
 * @param {object} params {amount, side}. Params send to API.
 * @returns {string} ETH, in WEI, that user will need/get in case of buy/sell MET.
 */
async function getQuote(acc, params) {
  const amount = new BigNumber(params.amount).multipliedBy(1e18).toFixed()
  if (params.side === 'SELL') {
    const sellEth = await acc.methods.getEthForMetResult(amount).call()
    return new BigNumber(sellEth).dividedBy(1e18).toFixed(18)
  } else if (params.side === 'BUY') {
    const sellEth = await acc.methods.getEthForMetResult(amount).call()

    let buyMet = 0
    let ethNeeded = ''

    let slippagePercentage = 1 // 1%
    while (new BigNumber(buyMet).isLessThan(amount)) {
      const multiplier = 1 + (slippagePercentage / 100)
      ethNeeded = new BigNumber(sellEth).multipliedBy(multiplier).integerValue().toString()
      buyMet = await acc.methods.getMetForEthResult(ethNeeded).call()
      slippagePercentage++
    }
    return new BigNumber(ethNeeded).dividedBy(1e18).toFixed(18)
  }
}

/** 
 * @typedef {object} Transaction
 * @property {string} from from address aka user address.
 * @property {string} to ACC address, as user will be buying/selling from/to ACC.
 * @property {string} data Encoded abi for contract call.
 * @property {string} value Amount of ETH being send for this transaction.
 * @property {string} gas Amount of gas needed for this transaction.
 * @property {string} gasPrice Price of gas.
 * @property {string} nonce Transaction nonce.
*/

/**
 * Get transaction data which is prepared using user provided data.
 *
 * @param {object} acc Autonomous Converter Contract instance.
 * @param {object} web3 web3 instance.
 * @param {object} params params provided by user i.e. userAddress, side, amount etc.
 * @returns {Transaction} Transaction data, it can be signed and send using web3.
 */
async function getTransaction(acc, web3, params) {
  const { priority, userAddress, nonce, side } = params
  const amount = new BigNumber(params.amount).multipliedBy(1e18).toFixed()
  const minReturn = new BigNumber(params.minReturn).multipliedBy(1e18).toFixed()

  const transaction = {}
  transaction.from = userAddress
  transaction.to = acc._address

  if (side === 'BUY') {
    transaction.data = acc.methods.convertEthToMet(minReturn).encodeABI()
    transaction.value = web3.utils.toHex(amount)
    const gas = await acc.methods.convertEthToMet(minReturn).estimateGas({ from: userAddress, value: amount })
    transaction.gas = web3.utils.toHex(gas)
  } else if (side === 'SELL') {
    transaction.data = acc.methods.convertMetToEth(amount, minReturn).encodeABI()
    transaction.value = '0x0'
    const gas = await acc.methods.convertMetToEth(amount, minReturn).estimateGas({ from: userAddress })
    transaction.gas = web3.utils.toHex(gas)
  }

  const gasPrice = await getGasPrice(priority)
  transaction.gasPrice = web3.utils.toHex(gasPrice)

  if (nonce) {
    transaction.nonce = web3.utils.toHex(nonce)
  } else {
    transaction.nonce = web3.utils.toHex(await web3.eth.getTransactionCount(userAddress))
  }

  return transaction
}

/** 
* @typedef {object} MetTrade
* @property {string} price Metronome trade price of this trade.
* @property {string} quantity Metronome bought/sold in this trade.
* @property {string} side Type of metronome trade i.e. buy or sell.
* @property {string} timestamp Timestamp of metronome trade.
*/

/**
 * Get function for metronome trade data over given points in time.
 *
 * @param {object} model Mongo model to run query over database.
 * @param {object} params {from, to}. point in time
 * @returns {Array.<MetTrade>} Metronome trade data.
 */
function getTradeData(model, params) {
  const { from, to, limit } = params
  const tradeQuery = {
    'metaData.timestamp': { $gt: from, $lt: to },
    '$or': [
      { 'metaData.event': 'ConvertEthToMet' },
      { 'metaData.event': 'ConvertMetToEth' }]
  }
  return model.find(tradeQuery)
    .limit(limit)
    .sort('-metaData.timestamp')
    .then(response => {
      const trades = []
      response.forEach(trade => {
        const data = {}
        const eth = new BigNumber(trade.metaData.returnValues.eth)
        const met = new BigNumber(trade.metaData.returnValues.met)

        data.price = eth.dividedBy(met).toFixed(18)
        data.quantity = met.dividedBy(1e18).toFixed(18)
        data.side = 'sell'
        if (trade.metaData.event === 'ConvertEthToMet') {
          data.side = 'buy'
        }
        data.timestamp = moment(trade.metaData.timestamp * 1000)
        trades.push(data)
      })
      return trades
    })
}

/** 
 * @typedef {object} MetVolume
 * @property {string} date Date in YYYY-MM-DD format.
 * @property {string} volume Metronome trade volume of that day.
*/

/**
 * Get function for metronome trade volume data over given points in time.
 *
 * @param {object} model Mongo model to run query over database.
 * @param {object} params {from, to}. point in time.
 * @returns {Array.<MetVolume>} Array of metronome trade volume data.
 */
function getVolumes(model, params) {
  const { from, to } = params
  const tradeQuery = {
    'metaData.timestamp': { $gt: from, $lt: to },
    '$or': [
      { 'metaData.event': 'ConvertEthToMet' },
      { 'metaData.event': 'ConvertMetToEth' }]
  }
  const groupExpression = {
    _id: {
      $dateToString: {
        format: '%Y-%m-%d',
        date: { $toDate: { $multiply: ['$metaData.timestamp', 1000] } }
      }
    },
    totalEth: { $sum: { $toDecimal: '$metaData.returnValues.eth' } }
  }

  return model.aggregate()
    .match(tradeQuery)
    .group(groupExpression)
    .project('_id totalEth')
    .sort('-_id')
    .then(trades => {
      const volumes = []
      trades.forEach(trade => {
        const metVolume = {}
        metVolume.date = trade._id
        metVolume.volume = new BigNumber(trade.totalEth).dividedBy(1e18)
          .toFixed(18)

        volumes.push(metVolume)
      })
      return volumes
    })
}

/**
 * Get function for metronome volume during last 24 hours.
 *
 * @param {object} model Mongo model to run query over database.
 * @param {object} params {from, to}. defines last 24 hours period.
 * @returns {string} Metronome trade volume.
 */
function getVolume24(model, params) {
  const { from, to } = params
  const tradeQuery = {
    'metaData.timestamp': { $gt: from, $lt: to },
    '$or': [
      { 'metaData.event': 'ConvertEthToMet' },
      { 'metaData.event': 'ConvertMetToEth' }]
  }
  const groupExpression = {
    _id: null,
    totalEth: { $sum: { $toDecimal: '$metaData.returnValues.eth' } }
  }
  return model.aggregate()
    .match(tradeQuery)
    .group(groupExpression)
    .project('-_id totalEth')
    .then(trades => {
      if (!trades[0]) {
        return 0
      }
      return new BigNumber(trades[0].totalEth).dividedBy(1e18).toFixed(18)
    })
}

module.exports = { getOrderBook, getPrices, getQuote, getTradeData, getTransaction, getVolumes, getVolume24 } 