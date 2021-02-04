// required modules and exports;
const express = require('express');
const usersRouter = express.Router();
const _ = require('lodash');
const userReqValidation = require('../middlewares/userMiddleware');
const sgMail = require('@sendgrid/mail');
const { randomBytes } = require('crypto');
const config = require('config');
const redis = require('redis');

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
    user = new User({
        name: req.body.name,
        email: req.body.email,
        bio: req.body.bio,
        profilePicture: "sample/path/to/picture",
        socialMediaHandles: {
            twitter: req.body.twitter,
        }
    });

    await User.exists({ email: req.body.email }, async (err, exists) => {
        if (err) {
            res.status(500).send("An error occured. Try again in a while.");
        } else {
            if (exists == false) {
                let savedUser = await user.save();
                // console.log(savedUser);
                // res.status(201).send(savedUser);
                const emailSentStatus = await sendSignInEmailToUser(savedUser);
                if (emailSentStatus) {
                    res.send(`Check ${user.email} for the sign-in link.`);
                } else {
                    res.status(500).send("An error occured. Try signing up a while from now!");
                }
            } else {
                res.status(409).send("This email is already registered. Try signing in!");
            }
        }
    })
});

// sign up endpoint;
// validates new user request, creates a document and triggers sign in;
usersRouter.post('/new', userReqValidation.validateNewUserRequest, async (req, res) => {
    user = new User({
        name: req.body.name,
        email: req.body.email,
        bio: req.body.bio,
        profilePicture: "sample/path/to/picture",
        socialMediaHandles: {
            twitter: req.body.twitter,
        }
    });

    let savedUser = await user.save();
    console.log(savedUser);
    res.status(201).send(savedUser);
});

// update existing user;
usersRouter.post('/update/:userId', userReqValidation.validateUpdateUserDataRequest, async (req, res) => {
    const userId = req.params.userId;
    const user = await User.findById(userId);

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
usersRouter.get('/get/:userId', async (req, res) => {
    const userId = req.params.userId;
    const user = await User.findById(userId, (err, res) => {
        if (err) {
            res.status(500).send("We're sorry, an error occured.");
        }
    });

    res.send(user);
});

// get the current user's data;
usersRouter.get('/me', userReqValidation.validateCurrentUserRequest, async (req, res) => {
    const userId = req.userId;
    const currentUser = await User.findById(userId);
    res.send(currentUser);
});

// get all stories by a given user;
usersRouter.get('/get/:userId/stories', async (req, res) => {
    const userId = req.params.userId;
    await Story.find({ owner: userId }, (err, stories) => {
        if (err) {
            res.status(500).send({ error: "An error occured fetching the stories." });
        } else {
            if (stories) {
                res.send(stories);
            } else {
                res.status(404).send("No stories found for the given user.");
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
            res.header('x-auth-token', token).send();
            redisClient.del(reqEmail);
        } else {
            console.log("Ye kyaaaa ye bhi?");
            res.status(500).send(err);
        }
    });

});


// Send sign-in link to a user;
async function sendSignInEmailToUser(user) {
    const randomString = randomBytes(4).toString('hex');
    const link = "https://localhost:3000/api/user/authenticate/" + randomString + "?email=" + user.email;
    var message = {
        to: user.email,
        from: "support@telemetryblog.in",
        subject: "Your sign-in link for the Telemetry blog.",
        html: String(`Hi ${user.name}!<br>Here's your link to sign in.<br><a href=` + link + `>` + link + `</a>`)
    };

    const sentMailResponse = await sgMail.send(message);
    if (sentMailResponse[0].statusCode == '202') {
        redisClient.set(user.email, randomString);
        return true;
    } else {
        return false;
    }
};

module.exports = usersRouter;