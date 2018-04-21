const _ = require('lodash')
const { createHash, createHmac } = require('crypto')

const secret = createHash('sha256')
  .update(process.env.TOKEN)
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
    return res.status(403).json({msg: 'Access denied'})
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
    return res.status(201).json({msg: 'User already exists'})
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
