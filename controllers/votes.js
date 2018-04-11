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

  // if not exists, we create this new profile
  if (_.isNull(ProfileInstance)) {
    ProfileInstance = new Profile(
      {
        ip,
        session: 0
      }
    )
  }

  ProfileInstance.questions.push(newVote.questionId)

  const countVote0 = await countVotesByQuestionAndVoteDb(
    newVote.questionId,
    0
  )

  let proposalWins = 0

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

  console.log('proposalWins', proposalWins)

  if (newVote.voteId === proposalWins) {
    result = 'win'
  } else {
    ProfileInstance.session = ProfileInstance.session + 1
  }

  await updateProfileDb(ProfileInstance)

  return res.status(201).json({result})
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
