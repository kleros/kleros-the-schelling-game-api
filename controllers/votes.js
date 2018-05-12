const _ = require('lodash')
const mongoose = require('mongoose')

const Vote = require('../models/Vote')
const Profile = require('../models/Profile')
const Question = require('../models/Question')

exports.addVote = async (req, res) => {
  let result = 'loose'

  const newVote = await addVoteDb(new Vote({
    ...req.body
  }))

  let ProfileInstance = await getProfileBySignMsgDb(req.body.signMsg)

  if (_.isNull(ProfileInstance)) {
    return res.status(201).json({msg: 'User is not login'})
  }

  if (ProfileInstance.questions.length <= ProfileInstance.votes.length) {
    return res.status(400).json(
      {
        error: 'Maybe you need to create a question before call this entrypoint.'
      }
    )
  }

  // add votes in the profile session to have not duplicate questions
  ProfileInstance.votes.push(newVote.questionId)

  const countVote0 = await countVotesByQuestionAndVoteDb(
    newVote.questionId,
    0
  )

  let proposalWins = 0

  // need refactoring
  const countVote1 = await countVotesByQuestionAndVoteDb(
    newVote.questionId,
    1
  )

  if (countVote1 > countVote0) {
    proposalWins = 1
  }

  const countVote2 = await countVotesByQuestionAndVoteDb(
    newVote.questionId,
    2
  )

  if (countVote2 > countVote1) {
    proposalWins = 2
  }

  const countVote3 = await countVotesByQuestionAndVoteDb(
    newVote.questionId,
    3
  )

  if (countVote3 > countVote2) {
    proposalWins = 3
  }

  ProfileInstance.lastVoteTime = new Date()

  if (ProfileInstance.score === 0) {
    ProfileInstance.startVoteTime = new Date()
  }

  const question = await getQuestionDb(newVote.questionId)

  if (ProfileInstance.score >= ProfileInstance.best_score) {
    ProfileInstance.best_score = ProfileInstance.score
    const timeBestScore = ProfileInstance.lastVoteTime.getTime() - ProfileInstance.startVoteTime.getTime()
    if (timeBestScore < ProfileInstance.best_score_timestamp) {
      ProfileInstance.best_score_timestamp = timeBestScore
    }
  }

  if (newVote.voteId === proposalWins) {
    result = 'win'
    ProfileInstance.score = ProfileInstance.score + 1
    if (question.winners.indexOf(ProfileInstance._id) === -1) {
      question.winners.push(ProfileInstance._id)
    }
  } else {
    if (question.winners.indexOf(ProfileInstance._id) > -1) {
      const index = question.winners.indexOf(ProfileInstance._id)
      question.winners.splice(index, 1)
    }

    ProfileInstance.session = ProfileInstance.session + 1

    ProfileInstance.score = 0

    --ProfileInstance.amount

    const countWinners = question.winners.length
    if (question.winners.length > 0) {
      question.winners.map(async winnerId => {
        const winner = await getProfileByIdDb(winnerId)
        if (winner) {
          winner.amount += 1 / countWinners
          await updateProfileDb(winner)
        }
      })
    }
  }

  await updateQuestionDb(question)

  await updateProfileDb(ProfileInstance)

  return res.status(201).json({
    result,
    score: ProfileInstance.score,
    session: ProfileInstance.session,
    lastVoteTime: ProfileInstance.lastVoteTime,
    startVoteTime: ProfileInstance.startVoteTime,
    bestScore: ProfileInstance.best_score,
    bestScoreTimestamp: ProfileInstance.best_score_timestamp,
    amount: ProfileInstance.amount
  })
}

const addVoteDb = Vote => {
  return new Promise((resolve, reject) => {
    Vote.save((err, Vote) => {
      if (err) {
        reject(Error(err))
      }
      resolve(Vote)
    })
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

const countVotesByQuestionAndVoteDb = (questionId, voteId) => {
  return new Promise((resolve, reject) => {
    Vote
      .count(
        {questionId, voteId},
        (err, countVotes) => {
          if (err) {
            reject(err)
          }
          resolve(countVotes)
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

const getProfileByIdDb = id => {
  return new Promise((resolve, reject) => {
    Profile
      .findOne({_id: mongoose.Types.ObjectId(id)})
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
