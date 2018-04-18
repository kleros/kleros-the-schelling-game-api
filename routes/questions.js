const express = require('express')
const router = express.Router()

const QuestionHandler = require('../controllers/questions')
const VoteHandler = require('../controllers/votes')

/* GET question. */
router.get('/', QuestionHandler.getQuestion)

/* POST votes. */
router.post('/:questionId/votes/:voteId', VoteHandler.addVote)

module.exports = router
