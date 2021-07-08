var express = require('express');
var config = require('../config')
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.clearCookie("auth")
    res.clearCookie("auth", {domain : config.info["cookie_domain"]})
    res.redirect("/login")
});

module.exports = router;