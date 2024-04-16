const userRouter = require('express').Router()
const bcrypt = require('bcrypt')
const User = require('../models/users')


userRouter.get('/', async (request, response) => {
    const users = await User.find({})
        .populate('blogs', {title: 1, author: 1, url: 1})
    response.json(users)
})

userRouter.post('/', async (request, response) => {
    const { username, password, name } = request.body

    if (password.length < 3) {
        return response.status(400).json({
            error: 'password must be at least 3 characters'
        })
    }

    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    const user = new User({
        username,
        name,
        password: passwordHash
    })

    const savedUser = await user.save()

    response.status(201).json(savedUser)
})

module.exports = userRouter