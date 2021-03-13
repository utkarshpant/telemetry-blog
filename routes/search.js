// required modules and exports;
const express = require('express');

// User and Story Schema;
const User = require('../schema/userSchema');
const Story = require('../schema/storySchema');

const searchRouter = express.Router();

/*
    TODO: 
    Each database lookup is a promise that resolves independently,
    so use Promise.all to collect all results and send;
*/
searchRouter.get('/', (req, res) => {
    const query = req.query.querystring ? req.query.querystring : null;
    if (query == null) {
        return res.status(400).send({
            error: "EMPTY_QUERY_STRING",
            request: req.query
        });
    };

    const userSearchResults = User.find({
        $or: [
            { "firstName": { $regex: query, $options: 'i' } },
            { "lastName": { $regex: query, $options: 'i' } },
            { "username": { $regex: query, $options: 'i' } }
        ]
    })

    const storySearchResults = Story.find({

        "isPublished": true,
        $or: [
            { "owner": { $regex: query, $options: 'i' } },
            { "content.title": { $regex: query, $options: 'i' } },
            { "content.subtitle": { $regex: query, $options: 'i' } },
            { "tags": query }
        ]
    })

    Promise.all([userSearchResults, storySearchResults])
        .then(values => {
            res.send({
                data: values,
                request: req.query
            })
        })
        .catch(err => {
            res.status(500).send({
                error: err,
                request: req.query
            })
        });
    // res.status(200).send("query is" + query);
});

module.exports = searchRouter;