const _ = require('lodash')

const Vote = require('../models/Vote')
const Profile = require('../models/Profile')

exports.addVote = async (req, res) => {
  let result = 'loose'

  const newVote = await addVoteDb(new Vote({
    ...req.body
  }))

  const ip = (req.headers['x-forwarded-for'] ||
     req.connection.remoteAddress ||
     req.socket.remoteAddress ||
     req.connection.socket.remoteAddress).split(',')[0]

  let ProfileInstance = await getProfileDb(ip)

  if (_.isNull(ProfileInstance) || ProfileInstance.questions.length <= ProfileInstance.votes.length) {
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

  if (newVote.voteId === proposalWins) {
    result = 'win'
    ProfileInstance.score = ProfileInstance.score + 1
  } else {
    ProfileInstance.questions = []
    ProfileInstance.votes = []
    ProfileInstance.session = ProfileInstance.session + 1

    if (ProfileInstance.score > ProfileInstance.best_score) {
      ProfileInstance.best_score = ProfileInstance.score
      ProfileInstance.best_score_timestamp = ProfileInstance.lastVoteTime.getTime() - ProfileInstance.startVoteTime.getTime()
    }

    ProfileInstance.score = 0
  }

  await updateProfileDb(ProfileInstance)

  return res.status(201).json({
    result,
    score: ProfileInstance.score,
    session: ProfileInstance.session,
    lastVoteTime: ProfileInstance.lastVoteTime,
    startVoteTime: ProfileInstance.startVoteTime,
    bestScore: ProfileInstance.best_score,
    bestScoreTimestamp: ProfileInstance.best_score_timestamp
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
