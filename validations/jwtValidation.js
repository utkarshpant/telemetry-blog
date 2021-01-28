const jwt = require('jsonwebtoken');
const config = require('config');
const Story = require('../schema/storySchema');

function validateToken(token, userId) {
    const decoded = jwt.verify(token, config.get('jwtPrivateKey'));
    if (decoded._id === userId) {
        return true;
    } else {
        return false;
    }
};

async function validateTokenForStories(token, storyId) {
    const decoded = jwt.verify(token, config.get('jwtPrivateKey'));
    if (decoded) {
        const userId = await Story.findById(storyId, (err, story) => {
            if (err) {
                resizeBy.status(500).send("Something went wrong.");
            }
        })
        .select("owner");
        
        if (decoded._id === userId) {
            return true;
        } else {
            return false;
        }
    }
};

exports.validateToken = validateToken;
exports.validateTokenForStories = validateTokenForStories;