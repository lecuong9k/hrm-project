/**
 * Created by Antz01 on 16/10/2017.
 */
var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    key = "b2df428b9929d3ace78598bbf4e496b2"
const inputEncoding = 'utf8';
const outputEncoding = 'hex';

var config = require('../config')

module.exports.getCookie = function(req, name){
    if(req.cookies[name]){
        return decrypt(req.cookies[name])
    }
    return undefined
}
module.exports.setCookie = function(res, name, value, maxAge){
    res.cookie(name, encrypt(value), {domain : config.info["cookie_domain"], maxAge : maxAge})
}
function encrypt(value){
    const iv = new Buffer(crypto.randomBytes(16)).toString('hex').slice(0, 16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    var crypted = cipher.update(value, inputEncoding, outputEncoding);
    crypted += cipher.final(outputEncoding);
    return iv.toString('hex') + ":" + crypted.toString()
}

function decrypt(value){
    var textParts = value.split(':');

    //extract the IV from the first half of the value
    var IV = new Buffer(textParts.shift(), outputEncoding).toString('hex').slice(0, 16);;

    //extract the encrypted text without the IV
    const encryptedText = new Buffer(textParts.join(':'), outputEncoding);

    //decipher the string
    const decipher = crypto.createDecipheriv(algorithm, key, IV);
    var decrypted = decipher.update(encryptedText,  outputEncoding, inputEncoding);
    decrypted += decipher.final(inputEncoding);
    return decrypted.toString();
}