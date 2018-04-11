const mongoose = require('mongoose')
const Schema = mongoose.Schema

const VoteSchema = new Schema({
  questionId: String,
  voteId: Number,
  created_at: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('Vote', VoteSchema)
