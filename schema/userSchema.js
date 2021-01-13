const mongoose = require('mongoose');
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
    }
});

module.exports = mongoose.model('User', userSchema);