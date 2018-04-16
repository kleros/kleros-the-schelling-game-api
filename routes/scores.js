const express = require('express')
const router = express.Router()
const ScoreHandler = require('../controllers/scores')

/* GET best scores. */
router.get('/', ScoreHandler.getBestScores)

module.exports = router
