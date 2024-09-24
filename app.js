var createError = require('http-errors');
const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');
const {create} =require('express-handlebars')

const app = express();

var fileUpload=require('express-fileupload')
var db=require('./Config/connection')
var session=require('express-session')
//set up Handlebars using 'create'

const hbs = create({
  extname: 'hbs',
  defaultLayout: 'layout',
  layoutsDir: path.join(__dirname, 'views/layout'),
  partialsDir: path.join(__dirname, 'views/partials'),
});

// view engine setup
app.engine('hbs', hbs.engine);  // Use 'hbs.engine' to register the Handlebars engine



app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload())
app.use(session({secret:"Key",cookie:{maxAge:600000}}))
db.connect((err) => {
  if (err) {
      console.log('Connection Error: ', err);  // More detailed error logging
  } else {
      console.log('Database Connected to Port 27017');
  }
});
app.use('/', userRouter);
app.use('/admin', adminRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
