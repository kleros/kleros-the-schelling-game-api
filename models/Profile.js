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
  telegram: {
    type: String,
    default: 'telegram-'
  },
  twitter: {
    type: Boolean,
    default: false
  },
  address: {
    type: String,
    unique: true
  },
  amount: {
    type: Number,
    default: 42
  },
  affiliates: Array,
  sign_msg: {
    type: String,
    unique: true
  }
})

module.exports = mongoose.model('Profile', ProfileSchema)
