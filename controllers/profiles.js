const _ = require('lodash')

const Profile = require('../models/Profile')

exports.updateProfilePseudo = async (req, res) => {
  const ip = (req.headers['x-forwarded-for'] ||
     req.connection.remoteAddress ||
     req.socket.remoteAddress ||
     req.connection.socket.remoteAddress).split(',')[0]

  let ProfileInstance = await getProfileDb(ip)

  if (_.isNull(ProfileInstance)) {
    return res.status(201).json({msg: 'profile not found'})
  }

  ProfileInstance.username = req.body.username

  ProfileInstance = await updateProfileDb(ProfileInstance)

  return res.status(201).json(ProfileInstance)
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
