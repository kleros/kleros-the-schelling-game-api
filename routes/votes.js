const express = require('express')
const router = express.Router()
const VoteHandler = require('../controllers/Votes')

/* POST Votes. */
router.post('/', VoteHandler.addVote)

module.exports = router
