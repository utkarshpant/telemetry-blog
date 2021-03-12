/*

    This middleware is the common point to prepare responses
    and send them back to the client, terminating the request
    reponse cycle.

    This way, the request handlers for each route can focus on 
    serving the request, preparing the response to be sent back
    with either the data or the errors, and pass it on further.

    This middleware is supposed to standardise the response that is
    sent back to the client.

    The response object incoming should have
    1. a statusCode property
    2. either data or error objects

    The request body is extracted in the middleware from the req object.
    
*/
function (req, res, next) => {
    if (response.data) {
        res.send(response.statusCode).send({
            data: response.data,
            request: {
                body: req.body,
                headers: req.headers
            }
        });
    }

    else if (response.error) {
        res.send(response.statusCode).send({
            error: response.error,
            request: {
                body: req.body,
                headers: req.headers
            }
        });
    }
}