const express = require('express')
const router = express.Router()

const QuestionHandler = require('../controllers/questions')

/* POST questions. */
router.put('/', QuestionHandler.updateQuestion)

module.exports = router
