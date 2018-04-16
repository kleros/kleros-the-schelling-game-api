const _ = require('lodash')
const mongoose = require('mongoose')

const Question = require('../models/Question')
const Profile = require('../models/Profile')

exports.addQuestion = async (req, res) => {
  const newQuestion = await addQuestionDb(new Question({
    ...req.body
  }))

  newQuestion.proposals = newQuestion.proposals[0].split(',')

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
        session: 0,
        score: 0,
        best_score: 0,
        best_score_timestamp: 0,
        startVoteTime: new Date(),
        username: 'guest'
      }
    )

    await updateProfileDb(ProfileInstance)
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
