const mongoose = require('mongoose')


const userSchema = new mongoose.Schema({
    username: {
        type: String,
        minLength: 3,
        require: true,
        unique: true
    },
    password: {
        type: String,
        minLength: 3,
        require: true
    },
    name: String,
    blogs: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Blog'
        }
    ]
})

userSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
        delete returnedObject.password
    }
})

const User = mongoose.model('User', userSchema)

module.exports = User