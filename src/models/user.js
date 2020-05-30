const mongoose = require("mongoose")
const validator = require("validator")
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task') 

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Please use a valid email')
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be non negative!')
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 7,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('your password cannot contain the string password')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps:true
})

// A virtual property is a relationship between 2 entities
// requires a reference to the model, local and foreign fields as showned bellow
userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id', // what kind of field from our document will the other collection store
    foreignField: 'owner' // name of the field as appears in the other collection
})

// to actually use virtual properties you have to invoke the following dynamic (non-static) method:
// modelInstance.pupulate('virtualField').execPopulate()

userSchema.methods.toJSON = function () {
    let user = this
    const userObject = user.toObject()

    delete userObject.tokens
    delete userObject.password
    delete userObject.avatar

    return userObject
}

// also requires "this-binding" 
userSchema.methods.genAuthToken = async function () {
    const user = this
    const token = jwt.sign({_id:user._id.toString()},process.env.JWT_SECRET)

    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token
}

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({email})

    if (!user) {
        throw new Error('Unable to login')
    }
    
    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        throw new Error('Unable to login')
    }

    return user
}

// needs to be a standard function as arrow foos dont bind this and it'll play a role
// hashes plain text password before saving
userSchema.pre('save', async function (next) {
    const user = this

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

// Delete user tasks when user is deleted
userSchema.pre('remove', async function (next) {
    const user = this
    await Task.deleteMany({ owner: user._id})
    next()
})

const User = mongoose.model('User', userSchema)

module.exports = User