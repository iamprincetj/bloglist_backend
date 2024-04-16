const express = require('express')
require('dotenv').config()
require('express-async-errors')
const app = express()
const mongoose = require('mongoose')
const cors = require('cors')
const blogRouter = require('./controllers/blogs')
const { info, error } = require('./utils/logger')
const { requestLogger, unknownEndpoint, errorHandler, tokenExtractor, userExtractor } = require('./utils/middleware')
const { MONGODB_URI } = require('./utils/config')
const userRouter = require('./controllers/user')
const loginRouter = require('./controllers/login')

const url = MONGODB_URI
mongoose.set('strictQuery')

mongoose.connect(url)
    .then(() => {
        info('connected to MongoDB')
    })
    .catch(e => {
        error('failed to connect to MongoDB', e.message)
    })


app.use(cors())
app.use(express.json())
app.use(tokenExtractor)
app.use(userExtractor)
app.use(requestLogger)
app.use('/api/login', loginRouter)
app.use('/api/blogs', blogRouter)
app.use('/api/users', userRouter)
app.use(unknownEndpoint)
app.use(errorHandler)


module.exports = app