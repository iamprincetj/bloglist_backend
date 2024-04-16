const User = require('../models/users')
const { SECRET } = require('./config')
const { info, error } = require('./logger')
const jwt = require('jsonwebtoken')
const morgan = require('morgan')



const tokenExtractor = (request, response, next) => {
    const authorization = request.get('authorization')
    if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
        request.token = authorization.substring(7)
    }

    next()
}

const userExtractor = async (request, response, next) => {
    const authorization = request.get('authorization')

    if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
        const token = authorization.substring(7)
        const decodedToken = jwt.verify(token, SECRET)

        if (!decodedToken.id) {
            return response.status.json({
                error: 'token missing or invalid'
            })
        }

        const user = await User.findById(decodedToken.id)

        request.user = user
    }

    next()
}

const m = morgan(function (tokens, req, res) {
    const returned = `${tokens.method(req, res)} ${tokens.url(req, res)} ${tokens.status(req, res)} ${tokens.res(req, res, 'content-length')} - ${tokens['response-time'](req, res)} ms ${JSON.stringify(req.body)}`
    return [
        returned,
    ]
})

const requestLogger = (request, response, next) => {
    info('Method:', request.method)
    info('Path: ', request.path)
    info('Body ', request.body)
    info('---')
    next()
}

const unknownEndpoint = (request, response) => {
    response.status(404).send({
        error: 'unknown endpoint'
    })
}


const errorHandler = (err, request, response, next) => {
    error(err.message)

    if (err.name === 'CastError') {
        return response.status(400).send({error: 'malformatted id'})
    } else if (err.name === 'ValidationError') {
        return response.status(400).json({ error: err.message })
    } else if (err.name === 'MongoServerError') {
        return response.status(400).json({ error: 'expected `username` to be unique' })
    } else if (err.name === 'JsonWebTokenError') {
        return response.status(401).json({ error: 'unauthorized' })
    } else if (err.name === 'TokenExpiredError') {
        return response.status(401).json({
            error: 'token expired'
        })
    }

    next(err)
}


module.exports = {
    requestLogger,
    unknownEndpoint,
    errorHandler,
    tokenExtractor,
    userExtractor
}