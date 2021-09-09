module.exports = {
  errorResponse: (res, code, data, message) =>
    errorResponse(res, code, data, message),
  successResponse: (res, isExecuted, data, message) =>
    successResponse(res, isExecuted, data, message)
};
function errorResponse(res, code, data, message) {
  // res.status= code;
  let body = bodyContent(false, data, message)
  res.status(code).send(body)

}

function successResponse(res, isExecuted, data, message) {
  let body = bodyContent(isExecuted, data, message)
  res.status(200).send(body)
}
function bodyContent(isExecuted, data, message) {
  return {
    isExecuted,
    data,
    message
  };
}
