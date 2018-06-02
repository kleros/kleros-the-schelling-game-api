const _ = require('lodash')
const mongoose = require('mongoose')

const Question = require('../models/Question')
const Profile = require('../models/Profile')

// load enviornment variables
require('dotenv').config()

exports.updateQuestion = async (req, res) => {
  // secure this route (hash is not necessary because it's an env var)
  if (req.query.password !== process.env.SECRET) {
    return res.status(201).json({msg: 'access denied'})
  }

  let questionDb = await getQuestionByIdDb(req.body.questionId)

  if (!_.isEmpty(req.body.proposals)) {
    questionDb.proposals = req.body.proposals.split(',')
  }

  if (!_.isEmpty(req.body.question)) {
    questionDb.question = req.body.question
  }

  if (req.body.valid !== undefined) {
    questionDb.valid = req.body.valid

    

    if (questionDb.address) {

      const profile = await getProfileByAddressDb(questionDb.address.toLowerCase())

      if (profile) {

        if (req.body.valid) {
          profile.amount += 10
        } else {
          profile.amount -= 10
        }

        await updateProfileDb(profile)
      }
    }
  }

  await updateQuestionDb(questionDb)

  return res.status(201).json(await getAllQuestionsDb())
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

  if(newQuestion.address) {
    newQuestion.address = newQuestion.address.toLowerCase()
  }

  newQuestion.proposals = newQuestion.proposals[0].split(',')

  newQuestion = await addQuestionDb(newQuestion)

  return res.status(201).json(newQuestion)
}

exports.getQuestion = async (req, res) => {
  let category = 'crypto'

  if (req.query.theme === 'crypto' || req.query.theme === 'football' || req.query.theme === 'general') {
    category = req.query.theme    
  }

  let ProfileInstance = await getProfileBySignMsgDb(req.params.signMsg)

  if (_.isNull(ProfileInstance)) {
    return res.status(201).json({msg: 'User with this message signature is not registered'})
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

    // remove `winners` key
    questionMustAnswer.winners = undefined

    return res.status(201).json(questionMustAnswer)
  }

  const questionsAll = await getAllValidQuestionsByCategoryDb(category)
  const questionsAllIds = [...new Set(questionsAll.map(obj => obj._id))]

  let questionId

  if (ProfileInstance.questions.length !== 0) {
    const questionsAllFilter = questionsAllIds.filter(
      q => !ProfileInstance.questions.includes(q.toString())
    )

    questionId = questionsAllFilter[Math.floor(Math.random() * questionsAllFilter.length)]
  } else {
    questionId = questionsAllIds[Math.floor(Math.random() * questionsAllIds.length)]
  }

  if (_.isUndefined(questionId)) {
    return res.status(201).json({msg: 'You have answered all the questions. You can try tomorrow or add new question.'})
  }

  // add questions in the profile session to have not duplicate questions
  ProfileInstance.questions.push(questionId.toString())

  await updateProfileDb(ProfileInstance)

  const question = questionsAll.filter(question => question._id.toString() === questionId.toString())

  // remove `winners` key
  question[0].winners = undefined

  return res.status(201).json(question[0])
}

exports.getAllQuestions = async (req, res) => {
  // secure this route (hash is not necessary because it's an env var)
  if (req.query.password !== process.env.SECRET) {
    return res.status(201).json({msg: 'access denied'})
  }

  return res.status(201).json(await getAllQuestionsDb())
}

exports.getCountAllQuestions = async (req, res) => {
  const questions = await getAllValidQuestionsDb()
  return res.status(201).json({count: questions.length})
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

const getProfileBySignMsgDb = signMsg => {
  return new Promise((resolve, reject) => {
    Profile
      .findOne({sign_msg: signMsg})
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
        {
          valid: true
        },
        (err, questions) => {
          if (err) {
            reject(err)
          }
          resolve(questions)
        }
      )
  })
}

const getAllValidQuestionsByCategoryDb = category => {
  return new Promise((resolve, reject) => {
    Question
      .find(
        {
          valid: true,
          category: category
        },
        (err, questions) => {
          if (err) {
            reject(err)
          }
          resolve(questions)
        }
      )
  })
}

const getProfileByAddressDb = address => {
  return new Promise((resolve, reject) => {
    Profile
      .findOne({address})
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
