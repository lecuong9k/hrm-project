var express = require('express');
var router = express.Router();
var mysql = require('../libs/mysql')
/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('profileUser');
});

module.exports = router;
