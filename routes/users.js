// required modules and exports;
const express = require('express');
const usersRouter = express.Router();
const _ = require('lodash');
const userReqValidation = require('../middlewares/userMiddleware');
const sgMail = require('@sendgrid/mail');
const { randomBytes } = require('crypto');
const config = require('config');
const redis = require('redis');

const errorUtility = require("../utilities/responseObjects");

//setting txn mail api key;
sgMail.setApiKey(config.get('txnMailAPIKey'));

// creating redis client;
const redisClient = redis.createClient();

// User Schema;
const User = require('../schema/userSchema');
const Story = require('../schema/storySchema');
const { send } = require('@sendgrid/mail');

// setting the routes;
usersRouter.get('/', (req, res) => {
    res.status(200).send("This set of endpoints facilitate getting and updating user information.");
});

// save a new user's data;
// validations for existing users will come under auth API;
usersRouter.post('/signup', userReqValidation.validateNewUserRequest, async (req, res) => {

    // await User.exists({ email: req.body.email }, async (err, exists) => {
    //     if (err) {
    //         res.status(500).send("An error occured. Try again in a while.");
    //     } else {
    //         if (exists == false) {
    //             user = new User({
    //                 firstName: req.body.name.split(' ')[0],
    //                 lastName: (req.body.name.split(' ')[1] ? req.body.name.split(' ')[1] : ""),
    //                 username: req.body.username,
    //                 email: req.body.email,
    //                 bio: req.body.bio,
    //                 profilePicture: "",
    //                 socialMediaHandles: {
    //                     twitter: req.body.twitter,
    //                 }
    //             });

    //             try {
    //                 let savedUser = await user.save();
    //             } catch (err) {
    //                 let errObj = {};
    //                 for (field in err.errors) {
    //                     errObj[field] = err.errors[field].message;
    //                 }
    //                 res.status(500).send(errObj);
    //             }

    //             const emailSentStatus = await sendSignInEmailToUser(savedUser);
    //             if (emailSentStatus) {
    //                 res.send(`Check ${user.email} for the sign-in link.`);
    //             } else {
    //                 res.status(500).send("An error occured. Try signing up a while from now!");
    //             }
    //         } else {
    //             res.status(409).send("This email is already registered. Try signing in!");
    //         }
    //     }
    // })

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
            res.status(500).send({error: errObj, request: req.body});
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
usersRouter.get('/get/:username', async (req, res) => {
    const username = req.params.username;
    await User.findOne({ username: username }, (err, userData) => {
        if (err) {
            res.status(500).send("We're sorry, an error occured.");
        } else {
            if (userData == null) {
                res.status(404).send("No user found.");
            } else {
                res.send(userData);
            }
        }
    });
});

// get the current user's data;
usersRouter.get('/me', userReqValidation.validateCurrentUserRequest, async (req, res) => {
    const userId = req.userId;
    await User.findById(userId)
        .then(currentUser => {
            if (currentUser == null) {
                res.status(401).send("No user found. Try signing in again!");
            } else {
                res.send(currentUser);
            }
        })
        .catch(err => {
            res.status(500).send(err);
        })
});

// get all stories by a given user;
usersRouter.get('/get/:username/stories', async (req, res) => {
    const username = req.params.username;
    await Story.find({ owner: username }, (err, stories) => {
        if (err) {
            res.status(500).send({ error: "An error occured fetching the stories." });
        } else {
            if (stories.length == 0) {
                res.status(404).send("No stories found for the given user.");
            } else {
                res.send(stories);
            }
        }
    });
});

// send sign-in link to user via mail;
usersRouter.post('/signin', async (req, res) => {
    userEmail = req.body.email;
    const user = await User.findOne({ email: userEmail });
    if (user) {
        const emailSentStatus = await sendSignInEmailToUser(user);
        if (emailSentStatus) {
            res.send(`Check ${user.email} for the sign-in link.`);
        }
    } else {
        res.status(404).send("This email is not registered. Try signing up!");
    }
});

usersRouter.get('/authenticate/:reqRandomString', async (req, res) => {
    const reqRandomString = req.params.reqRandomString;
    const reqEmail = req.query.email;

    redisClient.get(reqEmail, async (err, storedRandomString) => {
        if (storedRandomString === reqRandomString) {
            const user = await User.findOne({ email: reqEmail });
            const token = user.generateJWT();
            res.cookie('x-auth-token', token).send();
            redisClient.del(reqEmail);
        } else {
            res.status(500).send(err);
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
            })
            .catch(err => {
                console.log(err);
                reject(false);
            });
    })
};

module.exports = usersRouter;