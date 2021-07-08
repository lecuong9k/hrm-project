var express = require('express');
var router = express.Router();
var md5 = require('md5');
var mysql = require('../../libs/mysql')
var static = require('../../libs/static')
var excel = require('../../libs/excel')
var fs = require('fs')
const request = require('request')
var URL = require('url').URL;

var multer  = require('multer')
var config = require('../../config')
var upload = multer({ dest: config.info.temp_file_dir, limits : {fileSize : 1024 * 1024 * 1024} })
var allUpload = upload.fields([{ name: 'file', maxCount: 10 }, { name: 'thumb', maxCount: 1 }, { name: 'proxy', maxCount: 1 }])

router.post('/', allUpload, async function(req, res, next) {
    if(req.user == undefined || req.user.type != "ADMIN") {
        res.json({err : "Permission denied"})
        return
    }
    let action = req.body.action
    switch (action) {
        case "get-all-order" : {
            let status = req.body.status
            mysql.getAllOrder(status, function (err, rs) {
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
        case "get-all-user" : {
            mysql.getAllUsers(function (err, rs) {
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
        case "get-order-by-id" : {
            let id = parseInt(req.body.id)
            if(isNaN(id)) {
                res.json({err : "invalid id"})
                return
            }
            mysql.getOrderById(id, function (err, rs) {
                res.json({err : err, data : rs})
            })
        }break;
        case "get-tickets" : {
            mysql.getAllTicket(function (err, rs) {
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
        case "update-order" : {
            let id = parseInt(req.body.id)
            let status = req.body.status
            if(isNaN(id) || status == undefined) {
                res.json({err : "invalid value"})
                return
            }
            if(status != "NEW" && status != "PROCESSING" && status != "DONE" && status != "CANCELLED") {
                res.json({err : "invalid status value"})
                return
            }
            if(status == "PROCESSING") {
                let botViewConfig = {}
                botViewConfig.server = req.body["config-bot-view-server"]
                botViewConfig.url = req.body["config-bot-view-url"]
                botViewConfig.keyword = req.body["config-bot-view-keyword"]
                botViewConfig.url_type = req.body["config-bot-view-url-type"]
                botViewConfig.total_times = req.body["config-bot-view-total-time"]
                botViewConfig.max_watch_time = req.body["config-bot-view-max-watch-time"]
                botViewConfig.suggest_videos = req.body["config-bot-suggest-videos"]
                botViewConfig.suggest_percent = req.body["config-bot-view-suggest-percent"]
                botViewConfig.hour_view = req.body["config-bot-view-hour-view"]
                botViewConfig.priority = req.body["config-bot-view-priority"]
                botViewConfig.page_watch = req.body["config-bot-view-page-watch"]
                botViewConfig.enable = req.body["config-bot-view-enable"]
                botViewConfig.max_view = req.body["config-bot-view-max-view"]

                let rsBotView = await startBotView(botViewConfig)
                if(rsBotView.err) {
                    res.json({err : "SEND BOT VIEW ERROR: " + rsBotView.err})
                    return
                }
                mysql.updateOrder(id, status, req.body["config-bot-view-server"]).then(function (rs) {
                    if(rs.err) {
                        res.json({err : "Đã gửi sang botview thành công. Nhưng update order bị lỗi => gửi cho a Minh"})
                        return
                    }
                    res.json({status : status})
                    // res.send("Thành công: " + rsBotView.data)
                })
            }else if (status == "DONE" || status == "CANCELLED"){
                mysql.getOrderById(id, async function (err, orders) {
                    if(err) {
                        res.json({err : "Get order error"})
                        return
                    }
                    if(orders.length == 0) {
                        res.json({err : "cannot find order"})
                        return
                    }
                    let order = orders[0]

                    if(order.seo_servers != undefined) {
                        let videoId = undefined
                        try {
                            let url = new URL(order.link);
                            if(url.hostname == "www.youtube.com") {
                                videoId = url.searchParams.get('v')
                            }else {
                                videoId = url.pathname.substring(1)
                            }
                        }catch (e) {
                            console.log(e)
                        }
                        let stopRs = await checkOrderStatus.stopAllBotView(order.seo_servers, videoId)
                        if(stopRs.err) {
                            res.json({err : "STOP BOT VIEW ERROR: " + stopRs.err})
                            return
                        }
                    }
                    mysql.updateOrder(id, status).then(function (rs) {
                        if(rs.err) {
                            res.json({err : rs.err.toString()})
                            return
                        }
                        res.json({status : status})
                    })
                })

            }else {
                mysql.updateOrder(id, status).then(function (rs) {
                    if(rs.err) {
                        res.json({err : rs.err.toString()})
                        return
                    }
                    res.json({status : status})
                })
            }
        }break;
        case "mutil-update-order-status" : {
            let ids = req.body.ids
            let status = req.body.status
            if(ids == undefined || status == undefined) {
                res.json({err : "invalid data"})
                return
            }
            ids = req.body.ids.split(',')
            if(ids.length == 0) {
                res.json({err : "id not found"})
                return
            }
            setTimeout(async function (listId, newStatus) {
                let numberOK = 0
                let numberError = 0

                for(let i = 0; i < listId.length; i++) {
                    let rs = await mysql.updateOrder(listId[i], status)
                    if(rs.err) {
                        if(rs.code == 1) {
                            numberOK ++
                        }else {
                            numberError ++
                        }
                    }else {
                        numberOK ++
                    }
                }
                res.json({data : {err : numberError, ok : numberOK}})
            }, 0, ids, status)
        }break
        case "update-user" : {
            let uid = parseInt(req.body.id)
            let discountRate = parseInt(req.body.discount_rate)

            if(isNaN(uid) || isNaN(discountRate)) {
                res.render('500',  {msg : "Invalid data"})
                return
            }

            mysql.updateUser(uid, discountRate, function (err) {
                if(err) {
                    res.render('500', {msg : err.toString()})
                    return
                }
                res.redirect("/admin/manager-user")
            })
        }break;
        default: {
            res.render('500', {msg : "Unknown action"})
        }
    }
});
async function startBotView(formData) {
    return new Promise(resolve => {
        if(formData.server != undefined) {
            request.post(`http://${formData.server}/oam/start-playlist`, {form : formData}, function (err, httpResponse, body) {
                resolve({err : err, data : body})
            });
        }else {
            resolve({err : "START BOT VIEW ERROR. No server"})
        }
    })
}
module.exports = router;
