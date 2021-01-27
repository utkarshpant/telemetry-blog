const jwt = require('jsonwebtoken');

function validateToken(token, userId) {
    const decoded = jwt.verify(token, 'jwtPrivateKey');
    if (decoded._id === userId) {
        return true;
    } else {
        return false;
    }
};

module.exports = validateToken;