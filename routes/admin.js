const express = require('express')
const router = express.Router()

const QuestionHandler = require('../controllers/questions')

/* PUT questions. */
router.post('/', QuestionHandler.updateQuestion)

module.exports = router
