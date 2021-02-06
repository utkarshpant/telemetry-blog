const joi = require('joi');
const jwt = require('jsonwebtoken');
const config = require('config');

/*
    This function is middleware to validate 
    a request to create a new user, and will respond
    with an error and status code 400 BAD_REQUEST if any validation fails.
*/
async function validateNewUserRequest(req, res, next) {
    const schema = joi.object({
        name: joi.string()
                .min(3)
                .max(50),
        email: joi.string()
                .min(5)
                .max(100)
                .email()
                .required(),
        bio: joi.string()
                .max(250),
        socialMediaHandles: {
            twitter: joi.string()
                        .max(15)
                        .min(2)
        }
    });

    try {
        const result = await schema.validateAsync(req.body, {allowUnknown: true});
        next();
    } catch (err) {
        return res.status(404).send(err);
    }
};


/*
    This function is middleware to validate 
    a request to modify user data, and will respond
    with an error and status code 401 UNAUTHORISED if JWT verification fails,
    and 400 BAD_REQUEST if any validation fails.
*/
async function validateUpdateUserDataRequest(req, res, next) {
    const schema = joi.object({
        name: joi.string()
                .min(3)
                .max(50),
        email: joi.string()
                .min(5)
                .max(100)
                .email(),
        bio: joi.string()
                .max(250),
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
    This function is middleware to validate a request for the current user's information,
    i.e., the user identified in the JWT.
*/
async function validateCurrentUserRequest(req, res, next) {
    jwt.verify(req.header('x-auth-token'), config.get('jwtPrivateKey'), (err, decoded) => {
        if (err) {
            res.status(401).send("Invalid token");
        } else {
            req.userId = decoded._id;
            next();
        }
    });
}



exports.validateNewUserRequest = validateNewUserRequest;
exports.validateUpdateUserDataRequest = validateUpdateUserDataRequest;
exports.validateCurrentUserRequest = validateCurrentUserRequest;