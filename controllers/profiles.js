const _ = require('lodash')
const { createHash, createHmac } = require('crypto')

// load enviornment variables
require('dotenv').config()

const secret = createHash('sha256')
  .update(process.env.TOKEN_TELEGRAM)
  .digest()

const Profile = require('../models/Profile')

exports.addProfile = async (req, res) => {
  if (!checkSignature({
    hash: req.body.hash,
    username: req.body.username,
    id: req.body.id,
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    photo_url: req.body.photo_url,
    auth_date: req.body.auth_date })) {
    //return res.status(403).json({msg: 'Access denied'})
  }

  const ProfileInstance = await getProfileBytelegramIdDb(req.body.id)

  if (_.isEmpty(ProfileInstance)) {
    const ProfileInstanceTotal = new Profile(
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

    addProfileDb(ProfileInstanceTotal)

    return res.status(201).json(ProfileInstanceTotal)
  } else {
    if (ProfileInstance.lastVoteTime && Date.now() - ProfileInstance.lastVoteTime.getTime() > 10 * 1000) { //24 * 3600 * 1000
      ProfileInstance.session = 0
      ProfileInstance.questions = []
      ProfileInstance.votes = []
    }

    await updateProfileDb(ProfileInstance)

    return res.status(200).json(ProfileInstance)
  }
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

const getProfileBytelegramIdDb = telegramId => {
  return new Promise((resolve, reject) => {
    Profile
      .findOne({telegram_id: telegramId})
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

const checkSignature = ({ hash, ...data }) => {
  const checkString = Object.keys(data)
    .sort()
    .map(k => (`${k}=${data[k]}`))
    .join('\n')
  const hmac = createHmac('sha256', secret)
    .update(checkString)
    .digest('hex')
  return hmac === hash
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
