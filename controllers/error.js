/**
 * This function is used to return all error responses when app is in production
 * @param { AppError | Error } err
 * @param { Response } res
 */
const sendUserFriendlyError = (err, res) => {
  /*
  Is operational is added to the error response when the error has been constructed
  using AppError class. It means the message is defined by developer and is safe to be sent to the user.
   */
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      err: err.message,
    });
  } else {
    /*
     *In case isOperational is undefined, it means there has been an internal error in the application
     * and the message might reveal tech stack or some sensitive information. In that case, a generic error
     * message is sent
     */
    res.status(500).json({
      status: 'error',
      err: 'Oops, Looks like we hit a snag!',
    });
  }
};
/**
 * This function is  used to send all the error responses when app is being developed
 * This function includes the error stack trace in the response to make it easy while debugging
 * @param { AppError | Error }err
 * @param { Response } res
 */
const sendDevError = (err, res) => {
  res.status(err.isOperational ? err.statusCode : 500).json({
    status: err.isOperational ? err.status : 'error',
    err: err.message,
    stack: err.stack,
  });
};
module.exports = (err, req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    sendDevError(err, res);
  } else {
    sendUserFriendlyError(err, res);
  }
};
