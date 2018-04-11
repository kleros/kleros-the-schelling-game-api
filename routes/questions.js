const express = require('express')
const router = express.Router()
const QuestionHandler = require('../controllers/questions')
const VoteHandler = require('../controllers/votes')

/* GET questions. */
router.get('/', (req, res, next) => {
  res.send('What is your favourite blockchain? 1) Bitcoin 2) Ethereum 3) Ripple')
})

/* POST votes. */
router.post('/:questionId/votes/:voteId', VoteHandler.addVote)

/* POST questions. */
router.post('/', QuestionHandler.addQuestion)

module.exports = router
