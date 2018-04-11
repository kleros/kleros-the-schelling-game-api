const mongoose = require('mongoose')
const Schema = mongoose.Schema

const QuestionSchema = new Schema({
  question: String,
  proposals: [{
    proposal: String,
    description: String
  }],
  created_at: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('Question', QuestionSchema)