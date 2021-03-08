const mongoose = require('mongoose');
const userSchemaSchema = require('./userSchema');

const storySchema = new mongoose.Schema({
    owner: {
        type: String,
    },
    content: {
        title: String,
        subtitle: String,
        body: String,
    },
    tags: [String],
    isPublished: {
        type: Boolean,
        default: false
    },
    datePublished: {
        type: Date,
        default: null
    },
    dateModified: {
        type: Date,
        default: Date.now
    },
});

module.exports = mongoose.model('Story', storySchema);