'use strict'

const {
  history: { auctionOversampling, maxDataPoints },
  mongo: { url, dbName }
} = require('config')
const MongoClient = require('mongodb').MongoClient

const logger = require('../logger')

const getDb = MongoClient.connect(url).then(client => client.db(dbName))

function storeData ({ header, heartbeat, converterStatus }) {
  const {
    hash,
    number,
    timestamp
  } = header

  const min = Math.ceil(timestamp / 60)
  const hour = Math.ceil(min / 60)
  const week = Math.ceil(hour / 168)

  logger.debug('Storing data point at %s', timestamp)

  const {
    _lastPurchasePrice,
    currAuction,
    currentAuctionPrice,
    currTick,
    _dailyMintable,
    minting,
    proceedsBal,
    totalMET
  } = heartbeat

  const {
    availableMet,
    availableEth,
    currentConverterPrice
  } = converterStatus

  const data = {
    _lastPurchasePrice,
    currAuction,
    currentAuctionPrice,
    currTick,
    _dailyMintable,
    hash,
    minting,
    number,
    proceedsBal,
    timestamp,
    totalMET,
    availableMet,
    availableEth,
    currentConverterPrice
  }

  return getDb.then(function (db) {
    return Promise.all([
      db.collection('history-sec').insertOne(
        Object.assign({ _id: timestamp }, data)
      ),
      db.collection('history-min').replaceOne(
        { _id: min },
        { $set: data },
        { upsert: true }
      ),
      db.collection('history-hour').replaceOne(
        { _id: hour },
        { $set: data },
        { upsert: true }
      ),
      db.collection('history-week').replaceOne(
        { _id: week },
        { $set: data },
        { upsert: true }
      )
    ])
  })
}

const sampleArray = maxSamples =>
  function (array) {
    if (array.length <= maxSamples) {
      return array
    }

    const interval = (array.length - 1) / (maxSamples - 1)
    logger.debug('Sampling %s docs at intervals of %s', array.length, interval)

    const result = []

    let i = 0
    while (i < array.length) {
      result.push(array[Math.floor(i)])
      i += interval
    }

    return result
  }

function sampleAuctionArray (array) {
  if (array.length < 2) {
    return array
  }

  logger.debug('Sampling %d auction data points', array.length)

  const result = []

  // Push first item into the results
  result.push(array[0])

  // Iterate over the inner items and remove the ones with no auction price
  // change
  for (let i = 1; i < array.length - 1; i++) {
    const prevPrice = array[i - 1].currentAuctionPrice
    const currPrice = array[i].currentAuctionPrice
    const nextPrice = array[i + 1].currentAuctionPrice
    if (currPrice !== prevPrice || currPrice !== nextPrice) {
      result.push(array[i])
    }
  }

  // Push last item into the results
  result.push(array[array.length - 1])

  logger.debug('Sampling resulted in %d auction data points', result.length)

  return result
}

function getAllData (from, to, oversample = 1) {
  const timeWindow = Math.round((to - from) / oversample)

  logger.debug('Retrieving data (%ds)', timeWindow)

  let collectionName
  if (timeWindow > 16329600) { // 6 mo
    collectionName = 'history-week'
  } else if (timeWindow > 86400) { // 1 day
    collectionName = 'history-hour'
  } else if (timeWindow > 3600) { // 1 hr
    collectionName = 'history-min'
  } else {
    collectionName = 'history-sec'
  }

  logger.debug('Querying collection %s', collectionName)

  return getDb.then(function (db) {
    return db.collection(collectionName)
      .find({ timestamp: { $gte: from, $lte: to } })
      .sort({ timestamp: 1 })
      .toArray()
  })
}

const getData = (from, to) =>
  getAllData(from, to)
    .then(sampleArray(maxDataPoints))

const getAuctionData = (from, to) =>
  getAllData(from, to, auctionOversampling)
    .then(sampleAuctionArray)
    .then(sampleArray(maxDataPoints))

const getConverterData = getData

module.exports = { storeData, getData, getAuctionData, getConverterData }
