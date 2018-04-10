const express = require('express')
const router = express.Router()
var QuestionHandler = require('../controllers/questions')

/* GET questions. */
router.get('/', (req, res, next) => {
  res.send('What is your favourite blockchain? 1) Bitcoin 2) Ethereum 3) Ripple')
})

/* POST questions. */
router.post('/', QuestionHandler.addQuestion)

module.exports = router
