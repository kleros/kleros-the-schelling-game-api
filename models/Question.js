const mongoose = require('mongoose')
const Schema = mongoose.Schema

const QuestionSchema = new Schema({
  question: String,
  proposals: [String],
  created_at: {
    type: Date,
    default: Date.now
  },
  valid: Boolean,
  ip: String,
  address: String
})

module.exports = mongoose.model('Question', QuestionSchema)
