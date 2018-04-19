const _ = require('lodash')
const mongoose = require('mongoose')

const Question = require('../models/Question')
const Profile = require('../models/Profile')

exports.updateQuestion = async (req, res) => {
  // secure this route (hash is not necessary because it's an env var)
  if (req.body.password !== process.env.SECRET) {
    return res.status(201).json({msg: 'access denied'})
  }

  const questionDb = await getQuestionDb(req.body.questionId)

  let updateQuestion = new Question({
    ...req.body
  })

  updateQuestion.proposals = updateQuestion.proposals[0].split(',')

  const questionUpdated = Object.assign(questionDb, updateQuestion)
  
  return res.status(201).json(await updateQuestionDb(questionUpdated))
}

exports.addQuestion = async (req, res) => {
  let newQuestion = new Question({
    ...req.body
  })

  const ip = (req.headers['x-forwarded-for'] ||
   req.connection.remoteAddress ||
   req.socket.remoteAddress ||
   req.connection.socket.remoteAddress).split(',')[0]

  newQuestion.ip = ip
  newQuestion.valid = false

  newQuestion = await addQuestionDb(newQuestion)

  newQuestion.proposals = newQuestion.proposals[0].split(',')

  return res.status(201).json(newQuestion)
}

exports.getQuestion = async (req, res) => {
  let ProfileInstance = await getProfileByTelegramHashDb(req.params.hash)

  if (_.isNull(ProfileInstance)) {
    return res.status(201).json({msg: 'User is not login'})
  }

  const MAX_SESSIONS_PER_DAY = process.env.MAX_SESSIONS_PER_DAY ? process.env.MAX_SESSIONS_PER_DAY : 10

  // 1 day in milliseconds
  if (ProfileInstance.lastVoteTime !== undefined && ProfileInstance.session >= MAX_SESSIONS_PER_DAY && Date.now() - ProfileInstance.lastVoteTime.getTime() < 24 * 3600 * 1000) {
    return res.status(201).json({msg: 'You have made 10 sessions. Try tomorrow.'})
  }

  // if a questions has no answer, this question is displayed
  if (ProfileInstance.questions.length !== ProfileInstance.votes.length) {
    const questionIdMustAnswer = ProfileInstance.questions.filter(
      q => !ProfileInstance.votes.includes(q)
    )

    const questionMustAnswer = await getQuestionDb(questionIdMustAnswer[0])

    if (_.isEmpty(questionMustAnswer)) {
      return res.status(201).json({msg: 'no question'})
    }

    return res.status(201).json(questionMustAnswer)
  }

  const questionsAll = await getAllQuestionsDb()

  const questionsAllFilter = questionsAll.filter(
    q => !ProfileInstance.questions.includes(q)
  )

  const questionId = questionsAllFilter[Math.floor(Math.random() * questionsAllFilter.length)]

  // add questions in the profile session to have not duplicate questions
  ProfileInstance.questions.push(questionId)

  await updateProfileDb(ProfileInstance)

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

const updateProfileDb = Profile => {
  return new Promise((resolve, reject) => {
    Profile.save(
      (err, Profile) => {
        if (err) {
          reject(Error(err))
        }
        resolve(Profile)
      }
    )
  })
}

const getProfileByTelegramHashDb = hash => {
  return new Promise((resolve, reject) => {
    Profile
      .findOne({hash})
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

const updateQuestionDb = Question => {
  return new Promise((resolve, reject) => {
    Question.save(
      (err, Question) => {
        if (err) {
          reject(Error(err))
        }
        resolve(Question)
      }
    )
  })
}
