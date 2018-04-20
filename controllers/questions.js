const _ = require('lodash')
const mongoose = require('mongoose')

const Question = require('../models/Question')
const Profile = require('../models/Profile')

exports.updateQuestion = async (req, res) => {
  // secure this route (hash is not necessary because it's an env var)
  if (req.get('password') !== process.env.SECRET) {
    return res.status(201).json({msg: 'access denied'})
  }

  let questionDb = await getQuestionByIdDb(req.body.questionId)

  if (!_.isEmpty(req.body.proposals)) {
    questionDb.proposals = req.body.proposals.split(',')
  }

  if (!_.isEmpty(req.body.question)) {
    questionDb.question = req.body.question
  }

  if (!_.isEmpty(req.body.valid)) {
    questionDb.valid = req.body.valid
  }

  return res.status(201).json(await updateQuestionDb(questionDb))
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

  newQuestion.proposals = newQuestion.proposals[0].split(',')

  newQuestion = await addQuestionDb(newQuestion)

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
    return res.status(201).json({msg: 'You made 10 sessions. Try tomorrow.'})
  }

  // if a questions has no answer, this question is displayed
  if (ProfileInstance.questions.length !== ProfileInstance.votes.length) {
    const questionIdMustAnswer = ProfileInstance.questions.filter(
      q => !ProfileInstance.votes.includes(q)
    )

    const questionMustAnswer = await getQuestionByIdDb(questionIdMustAnswer[0])

    if (_.isEmpty(questionMustAnswer)) {
      return res.status(201).json({msg: 'no question'})
    }

    return res.status(201).json(questionMustAnswer)
  }

  const questionsAll = await getAllValidQuestionsDb()
  const questionsAllIds = [...new Set(questionsAll.map(obj => obj._id))]

  const questionsAllFilter = questionsAllIds.filter(
    q => !ProfileInstance.questions.includes(q.toString())
  )

  const questionId = questionsAllFilter[Math.floor(Math.random() * questionsAllFilter.length)]

  if (_.isUndefined(questionId)) {
    return res.status(201).json({msg: 'no question'})
  }

  // add questions in the profile session to have not duplicate questions
  ProfileInstance.questions.push(questionId.toString())

  await updateProfileDb(ProfileInstance)

  const question = questionsAll.filter(question => question._id.toString() === questionId.toString())

  return res.status(201).json(question[0])
}

exports.getAllQuestions = async (req, res) => {
  // secure this route (hash is not necessary because it's an env var)
  if (req.get('password') !== process.env.SECRET) {
    return res.status(201).json({msg: 'access denied'})
  }

  return res.status(201).json(await getAllQuestionsDb())
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
      .exec(
        (err, questions) => {
          if (err) {
            reject(err)
          }
          resolve(questions)
        }
      )
  })
}

const getQuestionByIdDb = id => {
  return new Promise((resolve, reject) => {
    Question
      .findOne(
        {
          _id: mongoose.Types.ObjectId(id)
        },
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

const getAllValidQuestionsDb = () => {
  return new Promise((resolve, reject) => {
    Question
      .find(
        {valid: true},
        (err, questions) => {
          if (err) {
            reject(err)
          }
          resolve(questions)
        }
      )
  })
}
