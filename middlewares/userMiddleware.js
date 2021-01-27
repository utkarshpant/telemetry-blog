const joi = require('joi');
const userSchema = require('../schema/userSchema');
const validateToken = require('../validations/jwtValidation');
/*
    This function is middleware to validate 
    a request to create a new user, and will respond
    with an error and status code 400 BAD_REQUEST if any validation fails.
*/
async function validateNewUserRequest(req, res, next) {
    const schema = joi.object({
        name: joi.string()
                .min(3)
                .max(50)
                .required(),
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
        return res.status(400).send(err);
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
    
    if (validateToken(req.header('x-auth-token'), req.params.userId) === true) {
        try {
            const result = await schema.validateAsync(req.body);
            next();
        } catch (err) {
            return res.status(400).send(err);
        }
    } else {
        return res.status(401).send("Invalid token!");
    } 
};



exports.validateNewUserRequest = validateNewUserRequest;
exports.validateUpdateUserDataRequest = validateUpdateUserDataRequest;