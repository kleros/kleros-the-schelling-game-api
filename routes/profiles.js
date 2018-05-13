const express = require('express')
const router = express.Router()

const ProfileHandler = require('../controllers/profiles')

/* POST add/update profile. */
router.post('/', ProfileHandler.addProfile)

/* ADD telegram profile. */
router.post('/telegram', ProfileHandler.addTelegramProfile)

module.exports = router
