const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const storySchema = require('./storySchema');
const config = require('config');
const { gt, lte, gte } = require('lodash');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: (value) => {
                return (gt(value.length, 0) && lte(value.length, 50))
            },
            message: "INVALID_FIRST_NAME"
        }
    },
    lastName: {
        type: String,
        trim: true,
        validate: {
            validator: (value) => {
                return (gte(value.length, 0) && lte(value.length, 50))
            },
            message: "INVALID_LAST_NAME"
        }
    },
    username: {
        type:String,
        required: true,
        trim: true,
        max: 20,
        validate: {
            validator: async (value) => {
                const exists = await mongoose.model("User", userSchema).exists({username: value});
                if (exists) {
                    return false;
                } else {
                    return true;
                }
            },
            message: "USERNAME_TAKEN"
        }
    },
    email: {
        type: String,
        required: true,
        trim: true,
        max: 50,
        validate: {
            validator: async (value) => {
                const exists = await mongoose.model("User", userSchema).exists({email: value});
                if (exists) {
                    return false;
                } else {
                    return true;
                }
            },
            message: "EMAIL_TAKEN"
        }
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

// // a custom validator for username
// userSchema.path('username').validate( async (value) => {
//     let exists = await mongoose.model('User', userSchema).exists({username: value});
//     if (exists) {
//         return false;
//     } else {
//         return true;
//     }
// }, "This username is already taken! Try another.");

module.exports = mongoose.model('User', userSchema);