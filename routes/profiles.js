const express = require('express')
const router = express.Router()
const ProfileHandler = require('../controllers/profiles')

/* PUT update profile. */
router.put('/', ProfileHandler.updateProfilePseudo)

module.exports = router
