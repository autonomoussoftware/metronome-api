'use strict'
const moment = require('moment-timezone')
const marketData = require('../../lib/market-data')
const config = require('config')
const BigNumber = require('bignumber.js')

/** 
 * @typedef {object} UniqueBuyerCount
 * @property {number} isa ISA unique buyers during given time frame.
 * @property {number} daily Daily unique buyers during given time frame.
 * @property {number} total Total unique buyers during given time frame.
*/

/**
 * Get function to get unique ISA (Initial Supply Auction) and daily buyers.
 * 
 * @param {object} model Mongo model to run query over database.
 * @param {object} params Contains 'from' and 'to' for query.
 * @returns {UniqueBuyerCount} Unique buyer count
 */
function getBuyerCount(model, params) {
  const { from, to } = params

  const isaEndTime = config.eth.isaEndTime
  const uniqueBuyerCount = {}
  // If given timeframe starts before ISA end and ends after ISA.
  // In this condition we do calculate total, isa and daily unique buyers
  if (from <= isaEndTime && to >= isaEndTime) {
    return Promise.all([
      model.distinct('metaData.returnValues.sender'),
      model.distinct('metaData.returnValues.sender',
        { 'metaData.timestamp': { $gt: from, $lt: isaEndTime } }),
      model.distinct('metaData.returnValues.sender',
        { 'metaData.timestamp': { $gt: isaEndTime, $lt: to } })
    ]).then(([buyers, isaBuyers, dailyBuyers]) => {
      uniqueBuyerCount.isa = isaBuyers.length
      uniqueBuyerCount.daily = dailyBuyers.length
      uniqueBuyerCount.total = buyers.length
      return uniqueBuyerCount
    })
    // eslint-disable-next-line no-else-return
  } else {
    return model.distinct('metaData.returnValues.sender',
      { 'metaData.timestamp': { $gt: from, $lt: to } })
      .then(response => {
        if (from > isaEndTime && to > isaEndTime) {
          uniqueBuyerCount.daily = response.length
        } else {
          uniqueBuyerCount.isa = response.length
        }
        return uniqueBuyerCount
      })
  }
}

/**
 * This function returns refund transaction query.
 * 
 * Refund Transaction: A transaction that purchase token via auction and buy 
 * all remaining tokens from auction and get some coin (ETH, ETC) as refund.
 * We can also call it as 'last transaction of the day' (via auction).
 * 
 * @param {number} from Query param, start time for mongo query.
 * @param {number} to Query param, ent time for mongo query.
 * @returns {object} Refund transaction query
 */

function getRefundTransactionQuery(from, to) {
  return {
    'metaData.event': 'LogAuctionFundsIn',
    'metaData.timestamp': { $gt: from, $lt: to },
    '$expr': { $gt: [{ $toDouble: '$metaData.returnValues.refund' }, 0] }
  }
}

/** 
 * @typedef {object} LastAuctionPrices
 * @property {object} lastOpeningPrice Opening price of last auction.
 * @property {object} lastClosingPrice Closing price of last auction. 
 * 
 * @typedef {object} lastOpeningPrice
 * @property {number} eth Opening price in eth
 * @property {number} usd Opening price in usd
 * 
 * @typedef {object} lastClosingPrice
 * @property {number} eth Closing price in eth
 * @property {number} usd Closing price in usd
*/

/**
 * This function returns opening and closing price for last auction.
 * 
 * Refund transaction also has price of that transaction, which gives us
 * closing price of that day. We can calculate opening price using
 * closing price of previous day.
 * 
 * @param {object} model Mongo model to run query over database.
 * @returns {LastAuctionPrices} Opening and closing price of last auction.
 */
function getlastAuctionPrices(model) {
  const from = moment().startOf('day').subtract(2, 'day').unix()
  const to = moment().unix()
  const query = getRefundTransactionQuery(from, to)
  return Promise.all([
    marketData.getRate('ethereum'),
    model.find(query).sort('-metaData.timestamp').lean()
  ]).then(([rate, prices]) => {
    let closingPrice = 0
    if (prices[0]) {
      closingPrice = prices[0].metaData.returnValues.purchasePrice
    }

    const closingPriceBN = new BigNumber(closingPrice).dividedBy(1e18)

    const lastClosingPrice = {}
    lastClosingPrice.eth = closingPriceBN.toFixed(18)
    lastClosingPrice.usd = closingPriceBN.multipliedBy(rate).toFixed(2)

    // Opening price is (previous days closing price * 2) + 1
    let openingPrice = 0
    if (prices[1]) {
      openingPrice = (prices[1].metaData.returnValues.purchasePrice * 2) + 1
    }
    const openingPriceBN = new BigNumber(openingPrice).dividedBy(1e18)

    const lastOpeningPrice = {}
    lastOpeningPrice.eth = openingPriceBN.toFixed(18)
    lastOpeningPrice.usd = openingPriceBN.multipliedBy(rate).toFixed(2)

    return { lastOpeningPrice, lastClosingPrice }
  })
}

/**
 * This function returns average auction duration.
 * 
 * Timestamp on refund transaction is closing time of auction.
 * Auction duration is calculated as a difference of auction closing time
 * and midnight of auction day.
 * 
 * @param {object} model Mongo model to run query over database.
 * @param {object} params {from, to, days}. Here days are number of days 
 *                        between from and to.
 * @returns {string} Average auction duration in seconds.
 */
function getAverageAuctionDuration(model, params) {
  const { from, to, days } = params
  const query = getRefundTransactionQuery(from, to)
  return model.find(query).lean().then(response => {

    let totalDifference = 0
    response.forEach(event => {
      const closingTime = event.metaData.timestamp
      const midnight = moment.unix(closingTime).startOf('day').unix()
      totalDifference += (closingTime - midnight)
    })
    return Math.floor(totalDifference / days)
  })
}

/** 
 * @typedef {object} AverageClosingPrice
 * @property {number} eth Average closing price in eth
 * @property {number} usd Average closing price in usd
*/

/**
 * This function returns average auction closing price.
 * 
 * Purchase price on refund transction is closing price of acution.
 * 
 * @param {object} model Mongo model to run query over database.
 * @param {object} params {from, to, days}. Here days are number of days 
 *                        between from and to.
 * @returns {AverageClosingPrice} Average closing price of auction.
 */
function getAverageClosingPrice(model, params) {
  const { from, to, days } = params

  const query = getRefundTransactionQuery(from, to)
  const groupExpression = {
    _id: null,
    totalClosingPrice: {
      $sum: { $toDouble: '$metaData.returnValues.purchasePrice' }
    }
  }

  return Promise.all([
    marketData.getRate('ethereum'),
    model.aggregate()
      .match(query)
      .group(groupExpression)
      .project('-_id totalClosingPrice')
  ]).then(([rate, prices]) => {
    let price = 0
    if (prices[0]) {
      price = prices[0].totalClosingPrice
    }
    const priceBN = new BigNumber(price).dividedBy(1e18).dividedBy(days)

    const closingPrice = {}
    closingPrice.eth = priceBN.toFixed(18)
    closingPrice.usd = priceBN.multipliedBy(rate).toFixed(2)
    return closingPrice
  })
}

module.exports = {
  getBuyerCount, getlastAuctionPrices,
  getAverageAuctionDuration, getAverageClosingPrice
}