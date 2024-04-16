const Blog = require('../models/blogs')
const User = require('../models/users')

const initialBlogs = [
    {
        'title': 'Hello, World',
        'author': 'Justin',
        'url': 'https://',
        'likes': 21,
    },
    {
        'title': 'Hi, World',
        'author': 'James',
        'url': 'https://',
        'likes': 21,
    }
]

const blogsInDB = async () => {
    const blogs = await Blog.find({})
    return blogs.map(blog => blog.toJSON())
}

const usersInDB = async () => {
    const users = await User.find({})
    return users.map(user => user.toJSON())
}

module.exports = { blogsInDB, initialBlogs, usersInDB }