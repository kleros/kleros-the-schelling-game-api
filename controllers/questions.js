const Question = require('../models/Question')

exports.addQuestion = async (req, res) => {
  const newQuestion = await addQuestionDb(new Question({
    ...req.body
  }))

  return res.status(201).json(newQuestion)
}

const addQuestionDb = Question => {
  return new Promise((resolve, reject) => {
    Question.save((err, Question) => {
      if (err) {
        reject(Error(err))
      }
      resolve(Question)
    })
  })
}
