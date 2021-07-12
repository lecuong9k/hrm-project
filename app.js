var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');


var static = require('./libs/static')
var config = require('./config')
var mysql = require('./libs/mysql')

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var login = require('./routes/login');
var register = require('./routes/register');
var api = require('./routes/api');
var dashboard = require('./routes/dashboard');
var logout = require('./routes/logout')
var profileUser = require('./routes/profileUser')
var employees = require('./routes/employees')

var adminAPI = require('./routes/admin/api')

var app = express();
app.set("env", "production")

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(authChecker)
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/login', login);
app.use('/register', register);
app.use('/api', api);
app.use('/dashboard', dashboard);
app.use('/logout', logout);
app.use('/profile', profileUser)
app.use('/admin/api', adminAPI);
app.use('/employees', employees)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    res.render('404')
  // next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');

  // res.render('500');
});

function authChecker(req, res, next) {
    req.config = config.info
    res.locals.req = req;

    let user = undefined
    try {
        user = JSON.parse(static.getCookie(req, "auth"))
    }catch (e){
    }
    if (user != undefined) {
        mysql.checkLogin(user.username, user.password, function(err, rs) {
            if(err == undefined && rs.length > 0) {
                let maxAge = 365 * 24 * 60 * 60 * 1000 // 1year
                static.setCookie(res, "auth", JSON.stringify(rs[0]), maxAge)
                req.user = rs[0]
                if(req.path.indexOf("/admin") == 0 && req.user.type != "ADMIN") {
                    res.render('400', {msg : "Permission denied"})
                    return
                }
                if(req.path == "/login" || req.path == "/register") {
                    res.redirect("/dashboard")
                }else {
                    next()
                }
            }else {
                res.clearCookie("auth")
                res.clearCookie("auth", {domain : config.info["cookie_domain"]})
                res.redirect("/login")
            }
        })
        return
    }
    if  (req.path == "/login" ||
         req.path == "/register" ||
         req.path == "/" ||
         req.path == "/services" ||
         req.path == "/pm/status" ||
         req.path == "/get-list-service" ||
         req.path == "/api/v1" ||
         req.path == "/coin/status" ||
        (req.path == "/api" && req.body.action == "login") ||
        (req.path == "/api" && req.body.action == "get-notify-new-order") ||
        (req.path == "/api" && req.body.action == "bank-notify") ||
        (req.path == "/api" && req.body.action == "register")
    ) {
        next()
    }else {
        res.clearCookie("auth")
        res.clearCookie("auth", {domain : config.info["cookie_domain"]})
        res.redirect("/login");
    }

}

module.exports = app;
