var express = require('express');
var router = express.Router();
var mysql = require('../libs/mysql')
var moment = require('moment-timezone');
/* GET home page. */
router.get('/', function(req, res, next) {
    mysql.getDepartmentUser(req.user.id, function (err, rs) {
        if(err) {
            res.send("Get user error: " + err.toString())
            return
        }
        res.render('profileUser', {moment: moment(req.user.date_of_birth).tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD"), department: rs[0].department_name});

    })
});
module.exports = router;
