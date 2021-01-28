// required modules and exports;
const express = require('express');
const storiesRouter = express.Router();
const _ = require('lodash');
const storyReqValidation = require("../middlewares/storyMiddleware");

// User Schema;
const Story = require('../schema/storySchema');
const { findById } = require('../schema/userSchema');
const User = require('../schema/userSchema');

// setting the routes;
storiesRouter.get('/', (req, res) => {
    res.status(200).send("This set of endpoints serve story creation and retrieval.");
});


// save a story;
storiesRouter.post('/new', storyReqValidation.validateNewStoryRequest, async(req, res) => {
    
    if (req.body.owner !== req.userId) {
        return res.status(401).send("Invalid token.");
    } 

    story = new Story({
        owner: req.body.owner,
        content: {
            title: req.body.storyTitle,
            subtitle: req.body.storySubtitle,
            body: req.body.storyBody
        },
        tags: req.body.storyTags
    });

    await story.save((err, savedStory) => {
        if (err) {
            res.status(500).send("An error occured.");
        } else {
            res.send(savedStory);
        }
    });
});

// get story by ID;
storiesRouter.get('/get/:storyId', async (req, res) => {
    const storyId = req.params.storyId;
    await Story.findById(storyId, (err, story) => {
        if (err) {
            res.status(500).send("We're sorry, an error occured.");
        } else {
            res.send(story);
        }
    });
});

// edit a story;
storiesRouter.post('/update/:storyId', storyReqValidation.validateUpdateStoryRequest, async(req, res) => {
    const storyId = req.params.storyId;
    const story = await Story.findById(storyId);
   
    if (story.owner != req.userId) {
        console.log(story.owner, req.userId);
        return res.status(401).send("Invalid token.");
    }

    for (property of Object.keys(req.body)) {
        story[property] = req.body[property];
    }

    await story.save((err, savedStory) => {
        if (err) {
            res.status(502).send(err);
        } else {
            res.send(savedStory);
        }
    });

    // let updates = {};

    // // building the update query dynamically;
    // for (property of Object.keys(req.body)) {
    //     updates[property] = req.body[property];
    // }
    
    // await Story.findByIdAndUpdate(storyId, { $set: updates })
    //     .then(story => {
    //         if (story) {
    //             res.send(story);
    //         } else {
    //             console.log("The Story ID is invalid.");
    //             res.status(500).send("The Story ID is invalid.");    
    //         }
    //     })
    //     .catch(err => {
    //         console.log("An error occured in updating the Story.");
    //         res.status(500).send("An error occured in updating the Story.");
    //     });
});

// delete a story;
storiesRouter.delete('/delete/:storyId', async (req, res) => {
    const storyId = req.params.storyId;
    const story = await Story.findByIdAndDelete(storyId)
        .catch(err => {
            console.log("An error occured in deleting the story.");
            res.status(500).send("An error occured in deleting the story.");
        });

    res.status(204).send();
})

module.exports = storiesRouter;