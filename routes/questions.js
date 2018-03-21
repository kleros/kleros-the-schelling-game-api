var express = require('express');
var router = express.Router();

/* GET questions. */
router.get('/', function(req, res, next) {
  res.send('What is your favourite blockchain? 1) Bitcoin 2) Ethereum');
});

module.exports = router;
