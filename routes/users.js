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
const redisClient = redis.createClient(process.env.REDIS_URL || 'redis://localhost:6379');
const userReqValidation = require('../middlewares/userMiddleware');
const usersRouter = express.Router();

// handling any connect errors;
redisClient.on('error', function(err) {
    console.log("Error", err);
})

// User Schema;
const User = require('../schema/userSchema');
const Story = require('../schema/storySchema');
const { property } = require('lodash');

// setting the routes;
usersRouter.get('/', (req, res) => {
    res.status(200).send("This set of endpoints facilitate getting and updating user information.");
});

// save a new user's data;
// validations for existing users will come under auth API;
usersRouter.post('/signup', userReqValidation.validateNewUserRequest, async (req, res) => {
    const reponse = {};
    User.findOne({ username: req.body.username })
        .then(existingUser => {
            if (existingUser) {
                return res.status(401).send({
                    error: "USERNAME_TAKEN",
                    response: res.body
                })
            }

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

            user.save()
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

        })
});

// update existing user;
usersRouter.post('/update/:username', userReqValidation.validateUpdateUserDataRequest, async (req, res) => {
    const username = req.params.username;
    const user = await User.findOne({ username: username });

    if (user.username != req.username) {
        return res.status(401).send({ error: "INVALID_TOKEN", request: req.body });
    }

    for (let property of Object.keys(req.body)) {
        user[property] = req.body[property];
        // console.log(property);
    }

    await user.save((err, savedUser) => {
        if (err) {
            res.status(500).send({ error: err, request: req.body });
        } else {
            res.send({ data: savedUser, request: req.body });
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
                    data: userData,
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
    const username = req.username;
    await User.findOne({ username: username })
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
    userUsername = req.body.username;
    User.findOne({ username: userUsername })
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
                        username: "NO_SUCH_USERNAME"
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

/*
    The authentication endpoint that is hit by the landing page on 
    successful sign in. 

    This method sets the access token as a cookie and returns
    a response body that includes the current user object 
    and the corresponding role, with status 200 OK.

    If the random token is not found in redis,
    a 410 GONE response is returned with an error object.
*/
usersRouter.get('/authenticate/:reqRandomString', async (req, res) => {
    const reqRandomString = req.params.reqRandomString;
    const reqEmail = req.query.email;
    // res.send("Hello");
    redisClient.get(reqEmail, async (err, storedRandomString) => {
        if (storedRandomString === reqRandomString) {
            const user = await User.findOne({ email: reqEmail });
            const token = user.generateJWT();
            res.send({
                data: user,
                role: "author",
                request: req.body,
                token: token
            });
            redisClient.del(reqEmail);
        } else {
            res.status(410).send({
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
        const link = "http://www.telemetryblog.in/authenticate/" + randomString + "?email=" + user.email;
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