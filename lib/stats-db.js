'use strict'

const { mongo: { url, dbName } } = require('config')
const MongoClient = require('mongodb').MongoClient

const logger = require('../logger')

const getDb = MongoClient.connect(url).then(client => client.db(dbName))

function storeData ({ header, heartbeat }) {
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
    dailyMintable,
    minting,
    proceedsBal,
    totalMET
  } = heartbeat

  const data = {
    _lastPurchasePrice,
    currAuction,
    currentAuctionPrice,
    currTick,
    dailyMintable,
    hash,
    minting,
    number,
    proceedsBal,
    timestamp,
    totalMET
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

function sampleArray (array, maxSamples) {
  const interval = Math.ceil(array.length / maxSamples)
  logger.debug('Sampling %s docs at intervals of %s', array.length, interval)
  const result = []
  let i = 0
  while (i < array.length) {
    result.push(array[i])
    i += interval
  }
  return result
}

function getData (from, to) {
  const timeWindow = to - from

  logger.debug('Retrieving data (%ds)', timeWindow)

  let collectionName
  if (timeWindow >= 16329600) { // 6 mo
    collectionName = 'history-week'
  } else if (timeWindow >= 86400) { // 1 day
    collectionName = 'history-hour'
  } else if (timeWindow >= 3600) { // 1 hr
    collectionName = 'history-min'
  } else {
    collectionName = 'history-sec'
  }

  logger.debug('Querying collection %s', collectionName)

  return getDb.then(function (db) {
    return db.collection(collectionName)
      .find({ timestamp: { $gte: from, $lte: to } })
      .sort({ timestamp: -1 })
      // .limit(1440)
      .toArray()
      .then(result => sampleArray(result, 50))
  })
}

module.exports = { storeData, getData }
