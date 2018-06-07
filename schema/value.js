'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const valueSchema = new Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true }
})

module.exports = valueSchema
