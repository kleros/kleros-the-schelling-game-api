var express = require('express');
var router = express.Router();

/* TODO POST answer. */
router.get('/', function(req, res, next) {
  res.send('POST 2');
});

module.exports = router;
