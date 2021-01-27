const mongoose = require('mongoose');
const joi = require('joi');
const jwt = require('jsonwebtoken');
const storySchema = require('./storySchema');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        max: 50,
        min: 3
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
    const token = jwt.sign({_id: this._id, signedIn: true}, "jwtPrivateKey");
    return token;
}

module.exports = mongoose.model('User', userSchema);