'use strict'

const marketData = require('../../lib/market-data')

/** 
 * @typedef {object} Conversions
 * @property {object} count Converter transaction counts
 * @property {object} eth Converter transaction amount and price in eth
 * @property {object} usd Converter transaction amount and price in usd
 * 
 * @typedef {object} count
 * @property {number} buy Buy transaction count
 * @property {number} sell Sell transaction count
 * @property {number} total Total (buy + sell) transaction count
 * 
 * @typedef {object} eth
 * @property {object} price Average token price, in ETH, during given timeframe
 * @property {number} in Number of ETH came into converter contract
 * @property {number} out Number of ETH left converter contract
 * @property {number} total Total ETH (in & out)
 * 
 * @typedef {object} usd
 * @property {object} price Average token price, in USD, during given timeframe
 * @property {number} in USD representation of ETH in
 * @property {number} out USD representation of ETH out
 * @property {number} total Total USD (in & out)
 * 
 * @typedef {object} price
 * @property {number} buy Average buy price
 * @property {number} sell Average sell price 
*/

/**
 * Get function to get unique ISA (Initial Supply Auction) and daily buyers.
 *
 * 
 * @param {object} model Mongo model to run query over database.
 * @param {object} params {from, to, days}. Here days are number of days 
 *                        between from and to.
 * @returns {Conversions} Autonomous Converter stats
 */
function conversions(model, params) {
    const { from, to, days } = params
    const buyQuery = { 'metaData.event': 'ConvertEthToMet', 'metaData.timestamp': { $gt: from, $lt: to } }
    const sellQuery = { 'metaData.event': 'ConvertMetToEth', 'metaData.timestamp': { $gt: from, $lt: to } }
    const groupExpression = {
        _id: null,
        totalEth: { $sum: { $toDouble: '$metaData.returnValues.eth' } },
        totalMet: { $sum: { $toDouble: '$metaData.returnValues.met' } }
    }

    return Promise.all([
        marketData.getRate('ethereum'),
        model.aggregate().match(buyQuery).group(groupExpression).project('-_id totalEth totalMet'),
        model.aggregate().match(sellQuery).group(groupExpression).project('-_id totalEth totalMet'),
        model.countDocuments(buyQuery),
        model.countDocuments(sellQuery)
    ]).then(([rate, buy, sell, buyCount, sellCount]) => {

        const eth = {}
        const usd = {}
        const count = {}
        count.buy = Math.ceil(buyCount / days)
        count.sell = Math.ceil(sellCount / days)
        count.total = count.buy + count.sell

        eth.price = {}
        eth.price.buy = buy[0].totalEth / buy[0].totalMet
        eth.price.sell = sell[0].totalEth / sell[0].totalMet
        eth.in = buy[0].totalEth / 1e18 / days
        eth.out = sell[0].totalEth / 1e18 / days
        eth.total = eth.in + eth.out

        usd.price = {}
        usd.price.buy = eth.price.buy * rate
        usd.price.sell = eth.price.sell * rate
        usd.in = eth.in * rate
        usd.out = eth.out * rate
        usd.total = eth.total * rate

        return { count, eth, usd }
    })
}

module.exports = { conversions }