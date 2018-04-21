const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ProfileSchema = new Schema({
  session: Number,
  question: Object,
  questions: Array,
  votes: Array,
  updated_at: {
    type: Date,
    default: Date.now
  },
  score: Number,
  best_score: Number,
  best_score_timestamp: Number,
  lastVoteTime: Date,
  startVoteTime: Date,
  username: {
    type: String,
    unique: true
  },
  telegram_id: {
    type: String,
    unique: true
  },
  hash: String,
  first_name: String,
  photo_url: String,
  auth_date: Number,
  amount: {
    type: Number,
    default: 42
  }
})

module.exports = mongoose.model('Profile', ProfileSchema)
