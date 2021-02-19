function constructErrorObject(req, res, errorObj, statusCode) {
    return {
        error: errorObj,
        request: requestObj,
        statusCode: statusCode
    }
};

function constructResponseObject(requestObj, responseObj, statusCode) {
    return {
        data: responseObj,
        request: requestObj,
        statusCode: statusCode
    }
}

module.exports = { constructErrorObject, constructResponseObject }