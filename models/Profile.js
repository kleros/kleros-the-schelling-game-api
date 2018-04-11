const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ProfileSchema = new Schema({
  ip: String,
  session: Number,
  questions: Array,
  updated_at: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('Profile', ProfileSchema)
