const jwt = require('jsonwebtoken');
/**
 * used as a middleware to get requests in /api/v1/tours.
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
    req = JSON.parse(
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
exports.signJWT = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
