const mongoose = require('mongoose')
const Schema = mongoose.Schema

const QuestionSchema = new Schema({
  question: String,
  proposals: [String],
  created_at: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('Question', QuestionSchema)
