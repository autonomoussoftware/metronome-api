'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const accountSchema = new Schema({
  _id: { type: String, required: true },
  balance: { type: String }
})

module.exports = accountSchema
