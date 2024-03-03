/**
 * This class provides some extra fields to work with status codes while handling errors
 * When an App error is thrown, it is passed down to global error handling middleware using next(err)
 * or throwing err inside of catchAsync function.
 * @see catchAsync
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = this.statusCode.toString().startsWith('4') ? 'fail' : 'error';
    this.operationalError = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
module.exports = AppError;
