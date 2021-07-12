var express = require('express');
var router = express.Router();
var md5 = require('md5');
var mysql = require('../libs/mysql')
var static = require('../libs/static')
var excel = require('../libs/excel')
var fs = require('fs')
var URL = require('url').URL;

var multer  = require('multer')
var config = require('../config')
var upload = multer({ dest: config.info.temp_file_dir, limits : {fileSize : 1024 * 1024 * 1024} })
var allUpload = upload.fields([{ name: 'file', maxCount: 10 }, { name: 'thumb', maxCount: 1 }, { name: 'proxy', maxCount: 1 }])

router.post('/', allUpload, async function(req, res, next) {
    let action = req.body.action
    switch (action) {
        case "login": {
            let username = req.body.username
            let password = req.body.password
            mysql.checkLogin(username, md5(password), function(err, rs) {
                if(err == undefined && rs.length > 0) {
                    let maxAge = 365 * 24 * 60 * 60 * 1000 // 1year
                    static.setCookie(res, "auth", JSON.stringify(rs[0]), maxAge)
                    res.redirect('/dashboard')
                }else {
                    res.redirect('/login')
                }
            })
        }break;

        case "update-profile": {
            let id = req.body.id
            let name = req.body.name
            let  dateOfBirth  = req.body.dateOfBirth
            let address = req.body.address
            let phoneNumber  = req.body.phoneNumber
            let emailCompany = req.body.emailCompany
            let emailIndividual = req.body.emailIndividual
            let skype = req.body.skype
            let city  = req.body.city
            let district  = req.body.district
            let ward  = req.body.ward
            let additionDetail  = req.body.additionDetail
            mysql.updateProfile(id, name, dateOfBirth, address, phoneNumber, emailCompany, emailIndividual, skype, city, district, ward, additionDetail, function (err, rs) {
                if(err) {
                    console.log('ERR ', err)
                    res.json({err: err.toString()})
                    return
                }
                res.json({})
            })
        }break;
        default: {
            res.render('500', {msg : "Unknown action"})
        }
    }
});
module.exports = router;
