'use strict'

const marketData = require('../../lib/market-data')
const BigNumber = require('bignumber.js')

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

        const buyEth = new BigNumber(buy[0].totalEth)
        const sellEth = new BigNumber(sell[0].totalEth)

        const buyPrice = buyEth.dividedBy(buy[0].totalMet)
        const sellPrice = sellEth.dividedBy(sell[0].totalMet)

        const ethIn = buyEth.dividedBy(1e18).dividedBy(days)
        const ethOut = sellEth.dividedBy(1e18).dividedBy(days)

        eth.price = {}
        eth.price.buy = buyPrice.toFixed(18)
        eth.price.sell = sellPrice.toFixed(18)
        eth.in = ethIn.toFixed(18)
        eth.out = ethOut.toFixed(18)
        eth.total = ethIn.plus(ethOut).toFixed(18)

        usd.price = {}
        usd.price.buy = buyPrice.multipliedBy(rate).toFixed(2)
        usd.price.sell = sellPrice.multipliedBy(rate).toFixed(2)
        usd.in = ethIn.multipliedBy(rate).toFixed(2)
        usd.out = ethOut.multipliedBy(rate).toFixed(2)
        usd.total = ethIn.plus(ethOut).multipliedBy(rate).toFixed(2)

        return { count, eth, usd }
    })
}

module.exports = { conversions }