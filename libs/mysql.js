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

module.exports.getDepartmentUser =  function(id, callback){
    pool.query("SELECT us.id, d.name as 'department_name' FROM users us INNER JOIN department d on us.department_id = d.id WHERE us.id = ?", [id], callback)
}

module.exports.updateProfile = function(id, name, dateOfBirth, address, phoneNumber, emailCompany, emailIndividual, skype, city, district, ward, additionDetail, callback){
    pool.query("UPDATE users SET name = ?, date_of_birth = ?, address = ?, phone = ?, email_company = ?, email_individual = ?, skype = ?, city = ?, district = ?, ward = ?, details = ?  WHERE id = ?",
        [name, dateOfBirth, address, phoneNumber, emailCompany, emailIndividual, skype, city, district, ward, additionDetail, id], callback)
}

module.exports.pool = pool