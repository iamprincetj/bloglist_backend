const Blog = require('../models/blogs')
const User = require('../models/users')
const jwt = require('jsonwebtoken')

const blogRouter = require('express').Router()


blogRouter.get('/', async (request, response) => {
    const blogs = await Blog.find({})
        .populate('user', {username: 1, name: 1})
    response.json(blogs)
})

blogRouter.get('/:id', async (request, response) => {
    const id = request.params.id
    const blog = await Blog.findById(id)

    if (blog) {
        response.json(blog)
    } else {
        response.status(404).end()
    }
})


blogRouter.post('/', async (request, response) => {
    const { title, url, likes, author } = request.body
    const token = request.token
    const decodedToken = jwt.verify(token, process.env.SECRET)

    if (!decodedToken.id) {
        return response.status(401).json({
            error: 'invalid token'
        })
    }

    const user = request.user
    if (!(title && url)) {
        return response.status(400).json({
            error: 'bad request'
        })
    }
    const blogToAdd = {
        title,
        author,
        url,
        likes: likes || 0,
        user: user._id
    }

    const blog = new Blog(blogToAdd)
    const savedBlog = await blog.save()
    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()
    response.status(201).json(savedBlog)
})

blogRouter.delete('/:id', async (request, response) => {
    const id = request.params.id
    const blog = await Blog.findById(id)
    const token = request.token
    
    const decodedToken = jwt.verify(token, process.env.SECRET)
    const userId = decodedToken.id

    if (!userId) {
        return response.status(401).json({
            error: 'token invalid'
        })
    }

    if (blog.user.toString() !== userId.toString()) {
        return response.status(401).json({
            error: 'invalid operation'
        })
    }
    await Blog.findByIdAndDelete(id)
    response.status(204).end()
})

blogRouter.put('/:id', async (request, response) => {
    const id = request.params.id
    const body = request.body
    const { title, author, url } = await Blog.findById(id)
    const updatedBlog = {
        title,
        author,
        url,
        likes: body.likes
    }
    const updated = await Blog.findByIdAndUpdate(id, updatedBlog, { new: true })
    response.json(updated)
})
module.exports = blogRouter