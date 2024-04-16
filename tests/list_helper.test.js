const { test, describe, after, beforeEach } = require('node:test')
const assert = require('node:assert')
const listHelper = require('../utils/list_helper')
const app = require('../app')
const supertest = require('supertest')
const mongoose = require('mongoose')
const api = supertest(app)
const { blogsInDB, initialBlogs, usersInDB } = require('./helper')
const Blog = require('../models/blogs')
const User = require('../models/users')
const bcrypt = require('bcrypt')
const { mostLikesData, blogList, favblog } = require('./blogs_data')



test('dummy returns one', () => {
    const blogs = []

    const result = listHelper.dummy(blogs)
    assert.strictEqual(result, 1)
})

describe('total likes', () => {
    const blogs = [
        {
            'title': 'Hello, World',
            'author': 'Justin',
            'url': 'https://',
            'likes': 21,
        },
        {
            'title': 'hello',
            'author': 'Justin',
            'url': 'htt',
            'likes': 16,
        },
        {
            'title': 'it\'s James',
            'author': 'James',
            'url': 'https::',
            'likes': 20,
        }
    ]

    const listWithOneBlog = [
        {
            'title': 'Hello, World',
            'author': 'Justin',
            'url': 'https://',
            'likes': 21
        }
    ]


    test('of empty list is zero', () => {
        const blog = []
        const result = listHelper.totalLikes(blog)

        assert.strictEqual(result, 0)
    })

    test('when list has only one blog equals the likes of that', () => {
        const result = listHelper.totalLikes(listWithOneBlog)
        assert.strictEqual(result, 21)
    })

    test('of a bigger list is calculated right', () => {
        const result = listHelper.totalLikes(blogs)
        assert.strictEqual(result, 57)
    })
})

describe('favorite blogs', () => {
    const blogs = favblog

    test('blog with most likes', () => {
        const blog = listHelper.favoriteBlog(blogs)
        const expected = {
            'title': 'Hello, World',
            'author': 'Justin',
            'url': 'https://',
            'likes': 21,
        }

        assert.deepStrictEqual(blog, expected)
    })
})


describe('most blog', () => {
    const blogs = blogList

    test('most blog of an author', () => {
        const blog = listHelper.mostBlogs(blogs)
        const expected = {
            author: 'Justin',
            blogs: 3
        }
        assert.deepStrictEqual(blog, expected)
    })
})

describe('most likes', () => {
    const blogs = mostLikesData

    test('most likes by an author', () => {
        const blog = listHelper.mostLikes(blogs)
        const expected = { author: 'James', likes: 97 }

        assert.deepStrictEqual(blog, expected)
    })
})


describe('backend testing', () => {

    let token
    beforeEach(async () => {
        await Blog.deleteMany({})
        await Blog.insertMany(initialBlogs)

        await User.deleteMany({})

        const hashedPassword = await bcrypt.hash('12345678', 10)
        const user = new User({
            username: 'James',
            password: hashedPassword
        })

        await user.save()

        const userToLogin = {
            username: 'James',
            password: '12345678'
        }

        const request = await api
            .post('/api/login')
            .send(userToLogin)

        token = request.body.token

        const blogToAdd =
        {
            'title': 'For Testing deleting',
            'author': 'James',
            'url': 'https://',
        }

        await api
            .post('/api/blogs')
            .send(blogToAdd)
            .set('authorization', 'Bearer ' + token)

    })
    test('returns the correct amount of blog posts in the JSON format', async () => {
        const response = await api
            .get('/api/blogs')
            .expect(200)
            .expect('Content-Type', /application\/json/)
        const blogsAtStart = await blogsInDB()
        assert.strictEqual(response.body.length, blogsAtStart.length)
    })

    test('unique identifier property of the blog posts is named id', async () => {
        const request = await api
            .get('/api/blogs')
            .expect(200)
            .expect('Content-Type', /application\/json/)

        const mylist = request.body
        const checkId = mylist.map(blog => Object.keys(blog))[0]
        assert(checkId.includes('id'))
    })
    test('successfully creates a new blog post', async () => {
        const blogsAtStart = await blogsInDB()
        const blog =
            {
                'title': 'Hello, World',
                'author': 'Justin',
                'url': 'https://',
                'likes': 21,
            }

        await api
            .post('/api/blogs')
            .send(blog)
            .set('authorization', 'Bearer '+ token)
            .expect(201)

        const blogsAtEnd = await blogsInDB()
        const titles = blogsAtEnd.map(blog => blog.title)
        assert.strictEqual(blogsAtEnd.length, blogsAtStart.length+1)
        assert(titles.includes('Hello, World'))
    })

    test('blog likes property defaults to zero', async () => {
        const blogToAdd =
        {
            'title': 'Hello, World',
            'author': 'Justin',
            'url': 'https://',
        }

        const response = await api
            .post('/api/blogs')
            .send(blogToAdd)
            .set('authorization', 'Bearer '+token)
            .expect(201)

        assert.strictEqual(response.body.likes, 0)
    })

    test('responds with status 400 if url or title is missing', async () => {
        const blogToAdd =
        {
            'author': 'Justin',
        }

        await api
            .post('/api/blogs')
            .send(blogToAdd)
            .set('authorization', 'Bearer '+ token)
            .expect(400)
    })

    test('delete a blog post', async () => {
        const blogsAtStart = await blogsInDB()
        const blogToDelete = blogsAtStart.find(blog => blog.title === 'For Testing deleting')

        await api
            .delete(`/api/blogs/${blogToDelete.id}`)
            .set('authorization', 'Bearer ' + token)
            .expect(204)

        const blogsAtEnd = await blogsInDB()
        const titles = blogsAtEnd.map(blog => blog.title)

        assert(!titles.includes('For Testing deleting'))
        assert.strictEqual(blogsAtEnd.length, blogsAtStart.length - 1)
    })

    test('updating the information of an individual blog post', async () => {
        const blogAtStart = await blogsInDB()
        const blogToUpdate = blogAtStart[0]
        const blogUpdate = {
            ...blogToUpdate,
            likes: blogToUpdate.likes + 1
        }
        await api
            .put(`/api/blogs/${blogToUpdate.id}`)
            .send(blogUpdate)
            .expect(200)
    })

    test('401 unauthorized if a token is not provided when adding a blog', async () => {
        const blogsAtStart = await blogsInDB()
        const blog =
            {
                'title': 'Hello, World',
                'author': 'Justin',
                'url': 'https://',
                'likes': 21,
            }

        const request = await api
            .post('/api/blogs')
            .send(blog)
            .expect(401)

        const error = request.body.error
        const blogsAtEnd = await blogsInDB()
        assert(error.includes('unauthorized'))
        assert.strictEqual(blogsAtEnd.length, blogsAtStart.length)
    })
})

describe('invalid users are not created', () => {
    beforeEach(async () => {
        await User.deleteMany({})

        const passwordHash = await bcrypt.hash('sekret', 10)
        const user = new User({ username: 'root', password: passwordHash })

        await user.save()
    })

    test('when password is less than 3 characters', async () => {
        const userAtStart = await usersInDB()
        const userToAdd = {
            username: 'King',
            name: 'James',
            password: '12'
        }

        const request = await api
            .post('/api/users')
            .send(userToAdd)
            .expect(400)

        const error = request.body.error
        const userAtEnd = await usersInDB()

        assert.deepStrictEqual(userAtEnd, userAtStart)
        assert(error.includes('password must be at least 3 characters'))
    })
    test('when username is less than 3 characters', async () => {
        const userAtStart = await usersInDB()
        const userToAdd = {
            username: 'Ki',
            name: 'James',
            password: '12321'
        }

        const request = await api
            .post('/api/users')
            .send(userToAdd)
            .expect(400)

        const error = request.body.error
        const userAtEnd = await usersInDB()

        assert.deepStrictEqual(userAtEnd, userAtStart)
        assert(error.includes(`(\`${userToAdd.username}\`) is shorter than the minimum allowed length (3)`))
    })
    test('when username is not unique', async () => {
        const userAtStart = await usersInDB()
        const userToAdd = {
            username: 'root',
            name: 'James',
            password: '12142'
        }

        const request = await api
            .post('/api/users')
            .send(userToAdd)
            .expect(400)

        const error = request.body.error
        const userAtEnd = await usersInDB()
        assert.deepStrictEqual(userAtEnd, userAtStart)
        assert(error.includes('expected `username` to be unique'))
    })
})


after(async() => {
    await mongoose.connection.close()
})