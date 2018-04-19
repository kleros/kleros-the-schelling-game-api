const express = require('express')
const router = express.Router()
const TelegramLogin = require('node-telegram-login')

const QuestionHandler = require('../controllers/questions')
const VoteHandler = require('../controllers/votes')

const TOKEN = '598944486:AAHzXWwBVcxwHAo9tIQHFfv68v07Vt2oxEk'
const MySiteLogin = new TelegramLogin(TOKEN)

/* GET question. With hash of the user */
router.get('/:hash', MySiteLogin.defaultMiddleware(), QuestionHandler.getQuestion)

/* POST votes. */
router.post('/:questionId/votes/:voteId', VoteHandler.addVote)

/* POST questions. */
router.post('/', QuestionHandler.addQuestion)

module.exports = router
