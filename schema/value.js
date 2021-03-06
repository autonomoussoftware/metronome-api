'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const valueSchema = new Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true }
})

module.exports = valueSchema
