// required modules and exports;
const express = require('express');
const storiesRouter = express.Router();
const _ = require('lodash');

// User Schema;
const Story = require('../schema/storySchema');
const User = require('../schema/userSchema');

// setting the routes;
storiesRouter.get('/', (req, res) => {
    res.status(200).send("This set of endpoints serve story creation and retrieval.");
});


// save a story;
storiesRouter.post('/save', async(req, res) => {
    story = new Story({
        owner: req.body.owner,
        content: {
            title: req.body.storyTitle,
            subtitle: req.body.storySubtitle,
            body: req.body.storyBody
        },
        tags: req.body.storyTags
    });

    let savedStory = await story.save();
    console.log(savedStory);
    res.send(savedStory);
});

// get story by ID;
storiesRouter.get('/get/:storyId', async (req, res) => {
    const storyId = req.params.storyId;
    const story = await Story.findById(storyId, (err, res) => {
        if (err) {
            res.status(500).send("We're sorry, an error occured.");
        } else {
            console.log(res);
        }
    });

    res.send(story);
});

// edit a story;
storiesRouter.post('/edit/:storyId', async(req, res) => {
    const storyId = req.params.storyId;
    const storyUpdates = {
        owner: req.body.owner,
        content: {
            title: req.body.storyTitle,
            subtitle: req.body.storySubtitle,
            body: req.body.storyBody
        },
        tags: req.body.storyTags
    }
    const story = await Story.findByIdAndUpdate(storyId, storyUpdates)
        .catch(err => {
            console.log("An error occured in updating the story.");
            res.status(500).send("An error occured in updating the story.");
        });
    
    res.status(201).send(story);
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