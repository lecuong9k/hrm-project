/**
 * Created by Antz01 on 22/09/2017.
 */

var mysql = require('mysql');
const static = require('./static')
var config = require('../config')
var pool  = mysql.createPool(config.info.mysql);

module.exports.checkLogin = function(user, pass, callback) {
    pool.query("SELECT * FROM users WHERE username = ? AND password = ?", [user, pass], callback)
}

module.exports.getProfileAccount = function(user, pass, callback) {
    pool.query("SELECT * FROM users WHERE username = ? AND password = ?", [user, pass], callback)
}

module.exports.pool = pool