const _ = require('lodash')
const mongoose = require('mongoose')

const Question = require('../models/Question')
const Profile = require('../models/Profile')

exports.addQuestion = async (req, res) => {
  const newQuestion = await addQuestionDb(new Question({
    ...req.body
  }))

  return res.status(201).json(newQuestion)
}

exports.getQuestion = async (req, res) => {
  const ip = (req.headers['x-forwarded-for'] ||
     req.connection.remoteAddress ||
     req.socket.remoteAddress ||
     req.connection.socket.remoteAddress).split(',')[0]

  let ProfileInstance = await getProfileDb(ip)

  // if not exists, we create this new profile
  if (_.isNull(ProfileInstance)) {
    ProfileInstance = new Profile(
      {
        ip,
        session: 0
      }
    )
  }

  const questionsAll = await getAllQuestionsDb()

  console.log(questionsAll)

  const questionsAllFilter = questionsAll.filter(
    q => !ProfileInstance.questions.includes(q)
  )

  const questionId = questionsAllFilter[Math.floor(Math.random() * questionsAllFilter.length)]

  const question = await getQuestionDb(questionId)

  return res.status(201).json(question)
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

const getProfileDb = ip => {
  return new Promise((resolve, reject) => {
    Profile
      .findOne({ip})
      .sort('-updated_at')
      .exec(
        (err, Profile) => {
          if (err) {
            reject(err)
          }
          resolve(Profile)
        }
      )
  })
}

const getAllQuestionsDb = () => {
  return new Promise((resolve, reject) => {
    Question
      .find()
      .distinct('_id')
      .exec(
        (err, questionsIds) => {
          if (err) {
            reject(err)
          }
          resolve(questionsIds)
        }
      )
  })
}

const getQuestionDb = id => {
  return new Promise((resolve, reject) => {
    Question
      .findOne(
        {_id: mongoose.Types.ObjectId(id)},
        (err, Question) => {
          if (err) {
            reject(err)
          }
          resolve(Question)
        }
      )
  })
}
