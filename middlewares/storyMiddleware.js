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
                    .required()
                    .min(1)
                    .max(200)
                    .trim(),
            subtitle: joi.string()
                    .min(1)
                    .max(200)
                    .trim(),
            body: joi.string()
            .required()
            .min(1)
            .max(20000)
            .trim(),
        },
        tags: joi.array()
                .items(joi.string().max(15))
                .max(5),
        socialMediaHandles: {
            twitter: joi.string()
                        .max(15)
                        .min(2)
        }
    });

    jwt.verify(req.header('x-auth-token'), config.get('jwtPrivateKey'), async (err, decoded) => {
        if (err) {
            return res.status(401).send(err);
        } else {
            req.userId = decoded._id;
            try {
                const result = await schema.validateAsync(req.body, {allowUnknown: true});
                next();
            } catch (err) {
                return res.status(400).send(err);
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
        content: {
            title: joi.string()
                    .required()
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
            return res.status(401).send(err);
        } else {
            req.userId = decoded._id;
            try {
                const result = await schema.validateAsync(req.body);
                next();
            } catch (err) {
                return res.status(400).send(err);
            }
        }
    });
};

exports.validateNewStoryRequest = validateNewStoryRequest;
exports.validateUpdateStoryRequest = validateUpdateStoryRequest;