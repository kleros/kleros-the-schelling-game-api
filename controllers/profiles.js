const fetch = require('node-fetch')
const sha3 = require('js-sha3').keccak256
const _ = require('lodash')
const ethereumJsUtil = require('ethereumjs-util')

// load enviornment variables
require('dotenv').config()

const Profile = require('../models/Profile')

exports.addProfile = async (req, res) => {
  const address = req.body.address.toLowerCase()
  const signMsg = req.body.signMsg

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

  const msg = 'Shelling_Game + @kleros_io + YOU = <3'

  const msgBuffer = ethereumJsUtil.toBuffer(msg)
  const msgHash = ethereumJsUtil.hashPersonalMessage(msgBuffer)
  const signatureBuffer = ethereumJsUtil.toBuffer(signMsg)
  const signatureParams = ethereumJsUtil.fromRpcSig(signatureBuffer)
  const publicKey = ethereumJsUtil.ecrecover(
    msgHash,
    signatureParams.v,
    signatureParams.r,
    signatureParams.s
  )
  const addressBuffer = ethereumJsUtil.publicToAddress(publicKey)
  const addressMsg = ethereumJsUtil.bufferToHex(addressBuffer)

  if (address !== addressMsg || !isAddress(address) || parseInt(balanceJson.result) / 1000000000000000000 < 0.1) {
    return res.status(403).json({msg: 'Access denied. You must the owner of the address and your balance must have at least 1 eth'})
  }

  const ProfileInstance = await getProfileBySignMsgDb(signMsg)

  if (_.isEmpty(ProfileInstance)) {
    // assume the real telegram user is different than the eth address
    const ProfileInstanceTotal = new Profile(
      {
        session: 0,
        score: 0,
        best_score: 0,
        best_score_timestamp: 0,
        startVoteTime: new Date(),
        address: address,
        sign_msg: signMsg,
        amount: 42
      }
    )

    addProfileDb(ProfileInstanceTotal)

    if (req.body.ref) {
      const referral = await getProfileByAddressDb(req.body.ref.toLowerCase())

      if (!_.isEmpty(referral)) {
        referral.affiliates.push(address)
        referral.amount += 10

        await updateProfileDb(referral)
      }
    }

    return res.status(201).json(ProfileInstanceTotal)
  } else {
    if (ProfileInstance.lastVoteTime && Date.now() - ProfileInstance.lastVoteTime.getTime() > 3600 * 1000) { // 1 hour
      ProfileInstance.session = 0
      ProfileInstance.score = 0
      ProfileInstance.questions = []
      ProfileInstance.votes = []

      const ProfileInstanceUpdated = await updateProfileDb(ProfileInstance)

      return res.status(200).json(ProfileInstanceUpdated)
    } else {
      return res.status(200).json(ProfileInstance)
    }
  }
}

exports.addTelegramProfile = async (req, res) => {
  let ProfileInstance = await getProfileBySignMsgDb(req.body.signMsg)

  if (ProfileInstance.telegram.startsWith('telegram-')) {
    ProfileInstance.telegram = req.body.telegram
    ProfileInstance.amount += 10
    const ProfileInstanceUpdated = await updateProfileDb(ProfileInstance)

    return res.status(201).json(ProfileInstanceUpdated)
  }

  return res.status(200).json(ProfileInstance)
}

exports.addTwitterProfile = async (req, res) => {
  let ProfileInstance = await getProfileBySignMsgDb(req.body.signMsg)

  if (!ProfileInstance.twitter) {
    ProfileInstance.amount += 10
  }

  ProfileInstance.twitter = true

  const ProfileInstanceUpdated = await updateProfileDb(ProfileInstance)

  return res.status(200).json(ProfileInstanceUpdated)
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

const isAddress = address => {
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
