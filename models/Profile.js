const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ProfileSchema = new Schema({
  ip: String,
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
  username: String
})

module.exports = mongoose.model('Profile', ProfileSchema)
