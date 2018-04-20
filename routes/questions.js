const express = require('express')
const router = express.Router()

const QuestionHandler = require('../controllers/questions')
const VoteHandler = require('../controllers/votes')

/* GET question. With hash of the user */
router.get('/:hash', QuestionHandler.getQuestion)

/* POST votes. */
router.post('/:questionId/votes/:voteId', VoteHandler.addVote)

/* GET all questions. */
router.get('/', QuestionHandler.getAllQuestions)

/* POST question. */
router.post('/', QuestionHandler.addQuestion)

module.exports = router
