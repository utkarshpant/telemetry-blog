// required modules and exports;
const express = require('express');
const usersRouter = express.Router();
const _ = require('lodash');
const userReqValidation = require('../middlewares/userMiddleware');
const nodemailer = require('nodemailer');
const { randomBytes } = require('crypto'); 
// User Schema;
const User = require('../schema/userSchema');
const Story = require('../schema/storySchema');

// setting the routes;
usersRouter.get('/', (req, res) => {
    res.status(200).send("This set of endpoints facilitate getting and updating user information.");
});

// save a new user's data;
// validations for existing users will come under auth API;
usersRouter.post('/new', userReqValidation.validateNewUserRequest, async(req, res) => {
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
    const token = user.generateJWT();
    console.log(savedUser);
    res.header('x-auth-token', token).send(savedUser);
});

// update existing user;
usersRouter.post('/update/:userId', userReqValidation.validateUpdateUserDataRequest, async (req, res) => {
    const userId = req.params.userId;
    let updates = {};

    // building the update query dynamically;
    for (property of Object.keys(req.body)) {
        console.log(property, req.body[property]);
        updates[property] = req.body[property];
    }
    
    await User.findByIdAndUpdate(userId, { $set: updates })
        .then(user => {
            if (user) {
                res.send(user);
            } else {
                console.log("The User ID is invalid.");
                res.status(500).send("The User ID is invalid.");    
            }
        })
        .catch(err => {
            console.log("An error occured in updating user information");
            res.status(500).send("An error occured in updating the user information.");
        });


    // res.status(201).send(updatedUser);
});

// get a user's data;
usersRouter.get('/get/:userId', async (req, res) => {
    const userId = req.params.userId;
    const user = await User.findById(userId, (err, res) => {
        if (err) {
            res.status(500).send("We're sorry, an error occured.");
        } else {
            console.log(res);
        }
    });

    res.send(user);
});

// get all stories by a given user;
usersRouter.get('/get/:userId/stories', async (req, res) => {
    const userId = req.params.userId;
    const stories = await Story.find({owner: userId}, (err, stories) => {
        if (err) {
            res.status(500).send({error: "An error occured fetching the stories."});
        } else {
            console.log(stories);
        }
    })
    .select('content tags datePublished');

    res.send(stories);
});

module.exports = usersRouter;