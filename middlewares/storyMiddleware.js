const config = require('config');
const joi = require('joi');
const jwt = require('jsonwebtoken');

/*
    This function is middleware to validate 
    a request to create a new story, and will respond
    with an error and status code 400 BAD_REQUEST if any validation fails.
*/
async function validateNewStoryRequest(req, res, next) {
    const schema = joi.object({
        owner: joi.string()
                .min(3)
                .max(50)
                .required()
                .trim(),
        content: {
            title: joi.string()
                    .min(1)
                    .max(200)
                    .trim(),
            subtitle: joi.string()
                    .min(1)
                    .max(200)
                    .trim(),
            body: joi.string()
            .min(1)
            .max(20000)
            .trim(),
        },
        tags: joi.array()
                .items(joi.string().max(15))
                .max(5),
    });

    jwt.verify(req.header('x-auth-token'), config.get('jwtPrivateKey'), async (err, decoded) => {
        if (err) {
            return res.status(401).send({error: err, request: req.body});
        } else {
            req.username = decoded.username;
            try {
                const result = await schema.validateAsync(req.body, {allowUnknown: true});
                next();
            } catch (err) {
                return res.status(400).send({error: err, request: req.body});
            }
        }
    });
};

/*
    This function is middleware to validate 
    a request to modify a story, and will respond
    with an error and status code 401 UNAUTHORISED if JWT verification fails,
    and 400 BAD_REQUEST if any validation fails.
*/
async function validateUpdateStoryRequest(req, res, next) {
    const schema = joi.object({
        owner: joi.string()
                .min(3)
                .max(50)
                .required()
                .trim(),
        content: {
            title: joi.string()
                    .min(1)
                    .max(200)
                    .trim(),
            subtitle: joi.string()
                    .min(1)
                    .max(200)
                    .trim(),
            body: joi.string()
            .min(1)
            .max(20000)
            .trim(),
        },
        dateModified: joi.date(),
        tags: joi.array()
                .items(joi.string().max(15))
                .max(5),
    });
    
    jwt.verify(req.header('x-auth-token'), config.get('jwtPrivateKey'), async (err, decoded) => {
        if (err) {
            return res.status(401).send({error: "INVALID_TOKEN", request: req.body});
        } else {
            req.username = decoded.username;
            try {
                const result = await schema.validateAsync(req.body);
                next();
            } catch (err) {
                return res.status(400).send({error: err, request: req.body});
            }
        }
    });
};

exports.validateNewStoryRequest = validateNewStoryRequest;
exports.validateUpdateStoryRequest = validateUpdateStoryRequest;