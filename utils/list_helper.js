const dummy = (blogs) => {
    return 1
}

const totalLikes = (blogs) => {
    const likes = blogs.map(blog => blog.likes)
    const result = likes.reduce((a, b) => {
        return a + b
    }, 0)
    return result
}

const favoriteBlog = (blogs) => {
    const likeMax = Math.max(...blogs.map(blog => blog.likes))
    const blogWithMostLikes = blogs.find(blog => blog.likes === likeMax)
    return blogWithMostLikes
}

const dictManipulation = (myDict) => {
    const myDictVal = Object.values(myDict)
    const myDictKey = Object.keys(myDict)
    const max = Math.max(...myDictVal)
    const idx = myDictVal.indexOf(max)
    const author = myDictKey[idx]

    return [author, max]
}

const mostBlogs = (blogs) => {
    const authors = blogs.map(blog => blog.author)
    const myDict = {}
    authors.forEach(val => {
        const author = Object.keys(myDict)
        if (author.includes(val)) {
            myDict[val] += 1
        }else {
            myDict[val] = 1
        }
    })

    const [author, max] = dictManipulation(myDict)

    return {
        author,
        blogs: max
    }
}


const mostLikes = (blogs) => {
    const authors = blogs.map(blog => blog.author)
    const myDict = {}
    authors.forEach(val => {
        const dictKey = Object.keys(myDict)
        if (!dictKey.includes(val)) {
            const myList = blogs.filter(blog => blog.author === val)
            const likes = myList.map(blog => blog.likes)
            const likeSum = likes.reduce((a, b) => a+b, 0)
            myDict[val] = likeSum
        }
    })

    const [author, max] = dictManipulation(myDict)

    return {
        author,
        likes: max
    }
}

module.exports = {
    dummy,
    favoriteBlog,
    totalLikes,
    mostBlogs,
    mostLikes
}