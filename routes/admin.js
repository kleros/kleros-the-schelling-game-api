const express = require('express')
const router = express.Router()

const QuestionHandler = require('../controllers/questions')

/* POST questions. */
router.post('/questions', QuestionHandler.addQuestion)

module.exports = router
