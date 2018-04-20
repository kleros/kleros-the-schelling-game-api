const express = require('express')
const router = express.Router()

const ProfileHandler = require('../controllers/profiles')

/* PUT update profile. */
router.post('/', ProfileHandler.addProfile)

module.exports = router
