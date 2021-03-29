// required modules and exports;
const express = require('express');
const storiesRouter = express.Router();
const _ = require('lodash');
const storyReqValidation = require("../middlewares/storyMiddleware");

// cors;
const cors = require('cors');
const corsOptions = {
    origin: ['http://localhost:3000', 'https://www.telemetryblog.in']
}

// Story Schema;
const Story = require('../schema/storySchema');

// setting the routes;
storiesRouter.get('/', (req, res) => {
    res.status(200).send("This set of endpoints serve story creation and retrieval.");
});


// save a story;
storiesRouter.post('/new', storyReqValidation.validateNewStoryRequest, async (req, res) => {

    if (req.body.owner !== req.username) {
        return res.status(401).send({ error: "INVALID_TOKEN", request: req.body });
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

    await story.save()
        .then(savedStory => {
            res.send({
                data: savedStory,
                created: savedStory._id.getTimestamp(),
                request: req.body
            });
        })
        .catch(err => {
            res.status(500).send({ error: "SERVER_ERROR", request: req.body });
        })
});

// get story by ID;
storiesRouter.get('/get/:storyId', async (req, res) => {
    const storyId = req.params.storyId;
    await Story.findById(storyId, (err, story) => {
        if (err) {
            res.status(500).send({
                err: "SERVER_ERROR",
                request: req.body
            });
        } else {
            if (story == null) {
                return res.status(404).send({
                    err: "NO_STORY_FOUND",
                    request: req.body
                });
            }
            res.send({
                data: story,
                created: story._id.getTimestamp(),
                request: req.body
            });
        }
    });
});

// edit a story;
storiesRouter.post('/update/:storyId', cors(corsOptions), storyReqValidation.validateUpdateStoryRequest, async (req, res) => {
    const storyId = req.params.storyId;
    await Story.findById(storyId, async (err, story) => {
        if (err) {
            res.status(500).send(err);
        } else {
            if (story == null) {
                res.status(404).send({
                    err: "NO_STORY_FOUND",
                    request: req.body
                });
            }

            if (story.owner != req.username) {
                return res.status(401).send({
                    err: "INVALID_TOKEN",
                    request: req.body
                });
            }

            for (property of Object.keys(req.body)) {
                story[property] = req.body[property];
            }

            await story.save((err, savedStory) => {
                if (err) {
                    res.status(500).send({
                        err: "SERVER_ERROR",
                        request: req.body
                    });
                } else {
                    res.header().send({
                        data: savedStory,
                        request: req.body
                    });
                }
            });
        }
    });


});

// delete a given story;
storiesRouter.delete('/delete/:storyId', async (req, res) => {
    const storyId = req.params.storyId;
    await Story.findByIdAndDelete(storyId)
        .catch(err => {
            console.log("An error occured in deleting the story.");
            res.status(500).send("An error occured in deleting the story.");
        });
    res.status(204).send();
})

// publish or unpublish a story;
storiesRouter.get('/:action/:storyId', async (req, res) => {
    const action = req.params.action;
    const storyId = req.params.storyId;
    let update = null;
    if (action == "publish") {
        update = {
            "isPublished": true
        }
    } else if (action == "unpublish") {
        update = {
            "isPublished": false
        }
    } else {
        return res.status(400).send({
            err: "UNKNOWN_REQUEST",
            request: req.params
        })
    }

    Story.findByIdAndUpdate(storyId, update)
        .then(story => {
            res.send({
                data: story,
                request: req.params
            })
        })
        .catch({
            err: err,
            request: req.params
        })
})

module.exports = storiesRouter;