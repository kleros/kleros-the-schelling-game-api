const _ = require('lodash')

const Profile = require('../models/Profile')

exports.addProfile = async (req, res) => {
  let ProfileInstance = await getProfileByTelegramHashDb(req.body.hash)

  if (_.isNull(ProfileInstance)) {
    ProfileInstance = new Profile(
      {
        session: 0,
        score: 0,
        best_score: 0,
        best_score_timestamp: 0,
        startVoteTime: new Date(),
        username: req.body.username,
        telegram_id: req.body.id,
        photo_url: req.body.photo_url,
        auth_date: req.body.auth_date,
        first_name: req.body.first_name,
        hash: req.body.hash
      }
    )
  } else {
    return res.status(201).json({msg: 'User already exists'})
  }

  await addProfileDb(ProfileInstance)

  return res.status(201).json(ProfileInstance)
}

const addProfileDb = Profile => {
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
