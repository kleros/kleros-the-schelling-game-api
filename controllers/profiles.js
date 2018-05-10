const fetch = require('node-fetch')
const sha3 = require('js-sha3').keccak256
const _ = require('lodash')

// load enviornment variables
require('dotenv').config()

const Profile = require('../models/Profile')

exports.addProfile = async (req, res) => {
  const address = req.body.address

  const balanceJson = await fetch(`https://mainnet.infura.io?token=${process.env.TOKEN_INFURA}`, {
    method: 'POST',
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_getBalance',
      params: [address, 'latest'],
      id: 1
    }), // stringify JSON
    headers: {'Content-Type': 'application/json'}
  })
    .then(res => res.json())
    .then(res => res)

  if (!isAddress(address) || (parseInt(balanceJson.result / 1000000000000000000) < 1)) {
    return res.status(403).json({msg: 'Access denied. Your address must a balance at least 1 eth'})
  }

  const ProfileInstance = await getProfileBytelegramIdDb(req.body.address)

  if (_.isEmpty(ProfileInstance)) {
    const ProfileInstanceTotal = new Profile(
      {
        session: 0,
        score: 0,
        best_score: 0,
        best_score_timestamp: 0,
        startVoteTime: new Date(),
        address: req.body.address,
      }
    )

    addProfileDb(ProfileInstanceTotal)

    return res.status(201).json(ProfileInstanceTotal)
  } else {
    if (ProfileInstance.lastVoteTime && Date.now() - ProfileInstance.lastVoteTime.getTime() > 3600 * 1000) { // 1 hour
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

const isAddress =  address => {
  if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
    return false
  } else if (/^(0x)?[0-9a-f]{40}$/.test(address) || /^(0x)?[0-9A-F]{40}$/.test(address)) {
    return true
  } else {
    return isChecksumAddress(address)
  }
}

const isChecksumAddress = address => {
  // Check each case
  address = address.replace('0x', '')
  const addressHash = sha3(address.toLowerCase())
  for (let i = 0; i < 40; i++) {
    // the nth letter should be uppercase if the nth digit of casemap is 1
    if ((parseInt(addressHash[i], 16) > 7 && address[i].toUpperCase() !== address[i]) || (parseInt(addressHash[i], 16) <= 7 && address[i].toLowerCase() !== address[i])) {
      return false
    }
  }
  return true
}
