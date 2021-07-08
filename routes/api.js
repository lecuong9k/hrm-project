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
        case "register" : {
            let username = req.body.username
            let password = req.body.password
            let confirm_password = req.body.confirm_password
            let email = req.body.email
            let name = req.body.name
            let phone = req.body.phone

            if(username == undefined || password == undefined || confirm_password == undefined || email == undefined || name == undefined || phone == undefined) {
                res.send("Hãy nhập đầy đủ thông tin")
                return
            }
            if(password != confirm_password) {
                res.send("Xác nhận mật khẩu không đúng")
                return
            }
            if(username.length < 6 || password.length < 6) {
                res.send("Tên tài khoản và mật khẩu phải trên 6 ký tự")
                return
            }
            mysql.checkUserExists(username, function (err, rs) {
                if(err) {
                    res.send("Đăng ký lỗi")
                    return
                }
                if(rs.length > 0) {
                    res.send("Tài khoản này đã tồn tại")
                    return
                }
                let apiKey = md5(`${username}.${md5(password)}.minhdv`)
                //module.exports.register = function(name, phone, username, email, password, callback) {
                mysql.register(name, phone, username, email, md5(password), apiKey, function(err, regRs) {
                    if(err) {
                        res.send("Đăng ký lỗi")
                        return
                    }
                    res.send("Đăng ký thành công <a href='/login'>Đăng nhập tại đây</a>")
                })
            })

        }break;
        case "get-list-service" : {
            let categoryId = parseInt(req.body.categoryId)
            if (isNaN(categoryId)) {
                res.json({err : "invalid category"})
                return
            }
            mysql.getServiceByCatagory(categoryId, function (err, rs) {
                if(err) {
                    res.json({err : "Get category error"})
                    return
                }
                res.json({data : rs})
            })
        }break;
        case "order" : {
            let serviceId = parseInt(req.body.service_id)
            let uid = req.user.id
            let quality = parseInt(req.body.quality)
            let link = req.body.link
            let exData = req.body.exData

            if(isNaN(serviceId) || req.user == undefined || req.user.id == undefined || isNaN(quality) || link == undefined) {
                res.json({err : "Dữ liệu không đúng"})
                return
            }
            let checkServiceRs = await mysql.checkServiceIsOk(serviceId)
            if(checkServiceRs.err) {
                res.json({err : checkServiceRs.err})
                return
            }

            let videoId = undefined
            try {
                let url = new URL(link);
                if(url.hostname == "www.youtube.com") {
                    videoId = url.searchParams.get('v')
                }else {
                    videoId = url.pathname.substring(1)
                }
            }catch (e) {
                console.log(e)
            }
            if(videoId == undefined) {
                res.json({err : "URL video không đúng định dạng"})
                return
            }
            let viewRs = await youtube.getView(videoId)
            if(viewRs.err) {
                res.json({err : "Get video view error"})
                return
            }
            let exDataJSON = undefined
            try {
                exDataJSON = JSON.parse(exData)
                exDataJSON.start_view = viewRs.data
            }catch (e) {
            }
            if(exDataJSON == undefined) {
                res.json({err : "EX data error"})
                return
            }
            //uid, service_id, link, quality, exData
            mysql.order(uid, serviceId, link, quality, JSON.stringify(exDataJSON)).then(function (rs) {
                res.json(rs)
            })
        }break;
        case "mutil-order" : {
            let data = []
            let multiOrder = req.body.multiOrder
            if(multiOrder == undefined) {
                res.send("invalid data")
                return
            }
            let orders = multiOrder.trim().split("\n")
            for (let i = 0; i < orders.length; i ++){
                if (orders[i] == '\r' || orders == undefined) continue
                let ord = orders[i].split("|")
                if(ord.length != 3){
                    res.send({alert: 'ERROR: Please again fill out all fields'})
                    return
                }else{
                    if(!Number.isInteger(parseInt(ord[0].trim())) || !Number.isInteger(parseInt(ord[1].trim()))){
                        res.send({alert: 'ERROR: Please check again ID_Service and Quality must both be numeric'})
                        return
                    }
                }
                let serviceId = ord[0].trim()
                let quality = ord[1].trim()
                let link = ord[2]
                data.push({service_id: serviceId, quality: quality, link: link})
            }
            let rs = await massOrderLib.processMutilOrder(req.user.id, data)
            res.render('template' , {page : "mutilOrderResult", data : rs})
        }break;
        case "get-orders-of-user" : {
            mysql.getAllOrderOfUser(req.user.id, function (err, rs) {
                if(err) {
                    res.json({error : "get data error"})
                    return
                }
                res.json({
                    "draw": 1,
                    "recordsTotal": rs.length,
                    "recordsFiltered": rs.length,
                    data : rs
                })
            })
        }break;
        case "get-transaction-of-user" : {
            mysql.getTransactionOfUser(req.user.id, function (err, rs) {
                if(err) {
                    res.json({error : "get data error"})
                    return
                }
                res.json({
                    "draw": 1,
                    "recordsTotal": rs.length,
                    "recordsFiltered": rs.length,
                    data : rs
                })
            })
        }break;
        case "get-ticket-of-user" : {
            mysql.getTicketOfUser(req.user.id, function (err, rs) {
                if(err) {
                    res.json({error : "get data error"})
                    return
                }
                res.json({
                    "draw": 1,
                    "recordsTotal": rs.length,
                    "recordsFiltered": rs.length,
                    data : rs
                })
            })
        }break;
        case "create-ticket" : {
            let title = req.body.title
            let des = req.body.des

            if(title == undefined || des == undefined) {
                res.send("Invalid data")
                return
            }
            let createRs = await mysql.createTicket(req.user.id, req.user.username, title, des)
            if(createRs.err) {
                res.render('500', {msg : "Tạo ticket lỗi. Hãy liên hệ trực tiếp với admin"})
                return
            }
            res.redirect("/tickets")
        }break;
        case "get-notify-new-order" : {
            redis.getSet("dm-services-notify-new-order", 0, function (err, rs) {
                res.json({err : err, data : rs})
            })
        }break;
        case "add-comment" : {
            let ticket_id = parseInt(req.body.ticket_id)
            let msg = req.body.msg
            if(isNaN(ticket_id) || msg == undefined) {
                res.send("invalid value")
                return
            }
            let isAdmin = req.user.type == "ADMIN"
            mysql.addTicketMessage(ticket_id, req.user.id, req.user.username, isAdmin, msg, function (err) {
                if(err) {
                    res.send("Add comment error")
                    return
                }
                if(isAdmin) {
                    res.redirect("/admin/manager-tickets?id=" + ticket_id)
                }else {
                    res.redirect("/tickets?id=" + ticket_id)
                }

            })
        }break;
        case "bank-notify" : {
            let account = req.body.account
            let amount = parseInt(req.body.amount)
            let time = req.body.time
            let transId = req.body.transId
            let content = req.body.content
            let sender = req.body.sender
            let raw = req.body.raw

            if(account == undefined || isNaN(amount) || time == undefined || content == undefined || sender == undefined || raw == undefined || transId == undefined) {
                console.log("BANK INFO ERROR", req.body)
                res.send("Invalid info");
                return
            }

            // DM123 DM<uid>
            let uid = undefined
            try {
                uid = parseInt(content)
            }catch (e) {
            }
            if(uid == undefined || isNaN(uid)) {
                console.log("BANK INFO ERROR. Invalid uid ", req.body)
                res.send("Invalid uid");
                return
            }

            if(amount < 0) {
                console.log("BANK INFO ERROR. Invalid amount ", req.body)
                res.send("Invalid amount");
                return
            }

            //uid, account, amount, time, transId, content, sender, raw
            mysql.addFund(uid, account, amount, time, transId, content, sender, raw, "VND", "PAID").then(function (rs) {
                if(rs.err) {
                    console.log("BANK NOTIFY ERROR", rs.err)
                    res.send("ADD FUND ERROR")
                    return
                }
                res.send("OK")
            })
        }break;
        default: {
            res.render('500', {msg : "Unknown action"})
        }
    }
});
module.exports = router;
