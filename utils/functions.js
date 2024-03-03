const jwt = require('jsonwebtoken');
/**
 * used as a middleware to get requests in /api/v1/tours, /api/v1/users.
 * The query is being modified to follow the syntax of filter object used in mongoose queries
 * The operators from query are passed as 'gte, lte, lt, gt' and after changes are made to this object all
 * the operators used in the object are prepended with '$'
 * The following process is folloed :
 * 1. The object is stringified
 * 2. All the operators are prefixes with a '$' using regex
 * 3. the object is parsed and used as the filter Object for mongoose query
 * @param req
 * @param res
 * @param next
 */
exports.modifyQueryToFilterObjSyntax = (req, res, next) => {
  try {
    req.query = JSON.parse(
      JSON.stringify({ ...req.query }).replace(
        /\b(gte|gt|lt|lte)\b/g,
        (match) => `$${match}`,
      ),
    );
  } catch (err) {
    console.log('MiddleWare Query mutation failed');
  }
  next();
};
exports.replaceCommaWithSpace = (input) => input.replace(/,/g, ' ');

/**
 * This function returns the max page count available based on the documentCount and the limit set by the user
 * @param {Number} docCount
 * @param {Number} limitPerPage
 * @returns Max Pages available when a limit is set per page
 */
exports.getMaxPageCount = (docCount, limitPerPage) =>
  Math.floor(docCount / limitPerPage) + (docCount % limitPerPage > 0 ? 1 : 0);

/**
 * @throws Invalid input error in case the provided input contains characters that are not a number
 * @param {String} input
 * @returns a number converted from a string after validation
 */
exports.convertToInteger = (input) => {
  const limitRegex = /^\d+$/;
  if (!limitRegex.test(input)) {
    throw new Error('Invalid limit number. Must consist only of digits.');
  }
  return parseInt(input, 10);
};
/**
 *This function accepts a userId and generates a JWT
 * @param {String} id
 * @returns signed JWT
 */
exports.signJWT = (id, res) => {
  const cookieOptions = {
    httpOnly: true,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
  res.cookie('jwt', token, cookieOptions);
  return token;
};

/**
 * This function filters and object based on an array of keys provided
 * All the keys that are not in the Array but are in object will be deleted
 * @param {Object} object
 * @param {[String]} allowedKeys
 */
exports.filterObject = (object, allowedKeys) => {
  Object.keys(object).forEach((key) => {
    if (!allowedKeys.includes(key)) delete object[key];
  });
  return object;
};
/**
 * This function is a wrapper around all the async routeHandlers. It accepts a routeHandler function as an argument
 * then returns an anonymous function which calls the routeHandler function with a .catch block to pass the
 * route handling to the global error handling middleware
 * @param fn routeHandler function
 * @returns {function(Request, Response, next): Promise<Response>}
 */

const catchAsync = (fn) => (req, res, next) => fn(req, res, next).catch(next);

exports.catchAsync = catchAsync;
