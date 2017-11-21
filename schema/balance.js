const mongoose = require('mongoose')
const Schema = mongoose.Schema

const balanceSchema = new Schema({
  _id: { type: String, required: true },
  balance: { type: String }
})

module.exports = balanceSchema
