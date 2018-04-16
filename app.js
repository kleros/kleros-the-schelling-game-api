const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const logger = require('morgan')
const colors = require('colors')
const mongoose = require('mongoose')

const indexRouter = require('./routes/index')
const questionsRouter = require('./routes/questions')
const scoresRouter = require('./routes/scores')
const profilesRouter = require('./routes/profiles')

// load enviornment variables
require('dotenv').config()

const config = require('./config')

mongoose.Promise = require('bluebird')

mongoose.connect(config.database)
  .then(() => console.log('Connected to the-schelling-game database'.green))
  .catch(err => console.error(err))

const app = express()

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

app.use('/', indexRouter)
app.use('/questions', questionsRouter)
app.use('/scores', scoresRouter)
app.use('/profiles', profilesRouter)

// catch 404 and forward to error handler
app.use((req, res, next) => next(createError(404)))

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

module.exports = app
