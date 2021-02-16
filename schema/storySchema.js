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
    datePublished: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Story', storySchema);