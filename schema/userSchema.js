const mongoose = require('mongoose');
const joi = require('joi');
const jwt = require('jsonwebtoken');
const storySchema = require('./storySchema');
const config = require('config');
const { string } = require('joi');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
        max: 50,
        min: 3
    },
    lastName: {
        type: String,
        trim: true,
        max: 50,
        min: 3
    },
    username: {
        type:String,
        required: true,
        trim: true,
        max: 20,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        max: 50
    },
    bio: String,
    profilePicture: String,
    socialMediaHandles: {
        twitter: String,
    },
    verified: {
        type: Boolean,
        default: false,
    }
});

userSchema.methods.generateJWT = function() {
    const token = jwt.sign({_id: this._id, signedIn: true, username: this.username}, config.get('jwtPrivateKey'));
    return token;
}

// a custom validator for username
userSchema.path('username').validate((value, response) => {
    mongoose.model('User', userSchema).exists({email: value})
        .then(exists => {
            if (exists) {
                response(false);
            }
        })
}, "This username is already taken! Try another.");

module.exports = mongoose.model('User', userSchema);