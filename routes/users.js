// required modules and exports;
const express = require('express');
const _ = require('lodash');
const sgMail = require('@sendgrid/mail');
const { randomBytes } = require('crypto');
const config = require('config');
const redis = require('redis');

/*
    1. Setting up SendGrid API and methods;
    2. Setting up a redis client;
    3. Importing request validation middleware;
    4. Setting up the router for the users endpoints;
*/

sgMail.setApiKey(config.get('txnMailAPIKey'));
const redisClient = redis.createClient();
const userReqValidation = require('../middlewares/userMiddleware');
const usersRouter = express.Router();


// User Schema;
const User = require('../schema/userSchema');
const Story = require('../schema/storySchema');

// setting the routes;
usersRouter.get('/', (req, res) => {
    res.status(200).send("This set of endpoints facilitate getting and updating user information.");
});

// save a new user's data;
// validations for existing users will come under auth API;
usersRouter.post('/signup', userReqValidation.validateNewUserRequest, async (req, res) => {
    const reponse = {};
    
    user = new User({
        firstName: req.body.name.split(' ')[0],
        lastName: (req.body.name.split(' ')[1] ? req.body.name.split(' ')[1] : ""),
        username: req.body.username,
        email: req.body.email,
        bio: req.body.bio,
        profilePicture: "",
        socialMediaHandles: {
            twitter: req.body.twitter,
        }
    });

    await user.save()
        .then(async (savedUser) => {
            await sendSignInEmailToUser(savedUser)
                .then(sent => {
                    res.send({
                        data: "EMAIL_SENT",
                        request: req.body
                    });
                })
                .catch(unsent => {
                    res.status(500).send({
                        error: "EMAIL_ERROR",
                        request: req.body
                    });
                })
        })
        .catch(error => {
            let errObj = {};
            for (field in error.errors) {
                errObj[field] = error.errors[field].message;
            }
            res.status(500).send({ 
                error: errObj, 
                request: req.body 
            });
        })
});

// update existing user;
usersRouter.post('/update/:username', userReqValidation.validateUpdateUserDataRequest, async (req, res) => {
    const userIdOrEmail = req.params.username;
    const user = await User.findOne({ username: username });

    if (userId != req.userId) {
        return res.status(401).send("Invalid token");
    }

    for (property of Object.keys(req.body)) {
        user[property] = req.body[property];
    }

    await user.save((err, savedUser) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.send(savedUser);
        }
    })
});

// get a user's data;
usersRouter.get('/get/:username', (req, res) => {
    const username = req.params.username;
    User.findOne({ username: username })
        .then(userData => {
            if (userData == null) {
                res.status(404).send({
                    error: "NO_USER_FOUND",
                    request: req.body
                });
            } else {
                res.send({
                    data:userData,
                    request: req.body
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                error: "SERVER_ERROR",
                request: req.body
            });
        });
});

// get the current user's data;
usersRouter.get('/me', userReqValidation.validateCurrentUserRequest, async (req, res) => {
    const userId = req.userId;
    await User.findById(userId)
        .then(currentUser => {
            if (currentUser == null) {
                res.status(401).send({
                    error: "NO_USER_FOUND",
                    request: req.body
                });
            } else {
                res.send({
                    data: currentUser,
                    request: req.body
                });
            }
        })
        .catch(err => {
            res.status(500).send(err);
        });
});

// get all stories by a given user;
usersRouter.get('/get/:username/stories', (req, res) => {
    const username = req.params.username;
    Story.find({ owner: username })
        .then(stories => {
            if (stories.length == 0) {
                res.status(404).send({
                    error: "NO_STORIES_FOUND",
                    request: req.body
                });
            } else {
                res.send({
                    data: stories,
                    request: req.body
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                error: "SERVER_ERROR",
                request: req.body
            })
        });
});

// send sign-in link to user via mail;
usersRouter.post('/signin', (req, res) => {
    userEmail = req.body.email;
    User.findOne({ email: userEmail })
        .then(async (user) => {
            if (user) {
                await sendSignInEmailToUser(user)
                .then(sent => {
                    res.send({
                        data: "EMAIL_SENT",
                        request: req.body
                    });
                })
                .catch(unsent => {
                    res.status(500).send({
                        error: "EMAIL_ERROR",
                        request: req.body
                    });
                })
            } else {
                res.status(404).send({
                    error: {
                        email: "NO_SUCH_EMAIL"
                    },
                    request: req.body
                });
            }
        })
        .catch(error => {
            res.status(500).send({ 
                error: "SERVER_ERROR", 
                request: req.body 
            });
        })
});

usersRouter.get('/authenticate/:reqRandomString', async (req, res) => {
    const reqRandomString = req.params.reqRandomString;
    const reqEmail = req.query.email;

    redisClient.get(reqEmail, async (err, storedRandomString) => {
        if (storedRandomString === reqRandomString) {
            const user = await User.findOne({ email: reqEmail });
            const token = user.generateJWT();
            res.cookie('x-auth-token', token).send({
                data: "AUTH_SUCCESSFUL",
                request: req.body
            });
            redisClient.del(reqEmail);
        } else {
            res.status(500).send({
                error: "TOKEN_NOT_FOUND",
                request: req.body
            });
        }
    });

});


// Send sign-in link to a user;
// resolves to true = sent;
// rejects to false = unsent;
async function sendSignInEmailToUser(user) {
    new Promise(async (resolve, reject) => {
        const randomString = randomBytes(4).toString('hex');
        const link = "https://localhost:3000/api/user/authenticate/" + randomString + "?email=" + user.email;
        var message = {
            "to": user.email,
            "from": {
                "email": "support@telemetryblog.in",
                "name": "Telemetry blog Support"
            },
            "template_id": config.get('txnMailTemplateId'),
            "dynamic_template_data": {
                name: user.firstName,
                randomToken: randomString,
                userEmail: user.email,
                signInLinkText: link
            }
        };
        await sgMail.send(message)
            .then(response => {
                // console.log(sentMailResponse);
                redisClient.set(user.email, randomString);
                resolve(true);
                console.log("SENT EMAIL");
            })
            .catch(err => {
                console.log(err);
                reject(false);
                console.log("DIDN'T SEND");
            });
    })
        .then(sent => {
            return true;
        })
        .catch(err => {
            return false;
        })
};

module.exports = usersRouter;