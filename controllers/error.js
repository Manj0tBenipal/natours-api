const AppError = require('../utils/AppError');
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
  if (err.operationalError) {
    res.status(err.statusCode).json({
      status: err.status,
      err: err.message,
    });
  } else {
    /*
     *In case operationalError is undefined, it means there has been an internal error in the application
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
  res.status(err.operationalError ? err.statusCode : 500).json({
    status: err.operationalError ? err.status : 'error',
    err: err.message,
    stack: err.stack,
  });
};

const handleCastErrorFromDB = (err) =>
  new AppError(
    `Data: '${err.value}' is not valid for field: '${err.path}'`,
    400,
  );

module.exports = (err, req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    sendDevError(err, res);
  } else {
    let error = { ...err };
    /*
     * These three types of errors happen because of user's invalid input and are not thrown using
     * AppError class. Therefore, they will be treated as sensitive errors. But to provide useful messages to the user,
     * these errors are destructured and a new AppError is constructed using data in the incoming Error object.
     *
     * This results in the error object includes operationalError:true and an error message defined by developer is sent
     * to the user
     */

    //It is thrown when a user provides invalid documentId

    if (err.name === 'CastError') error = handleCastErrorFromDB(err);
    sendUserFriendlyError(error, res);
  }
};
