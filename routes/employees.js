var express = require('express');
var router = express.Router();
var mysql = require('../libs/mysql')
var moment = require('moment-timezone');
/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('employees');
});

module.exports = router;