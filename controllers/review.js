const Review = require('../models/reviewModel');
const {
  getResourceById,
  createResource,
  getResources,
} = require('./handlerFactory');

exports.getAllReviews = getResources(Review);
exports.addTourAndUserId = (req, res, next) => {
  const tourIdFromParams = req.params.tourId;
  if (!req.body.tourId) req.body.tourId = tourIdFromParams;
  req.body.userId = req.user._id;
  next();
};

/**
 * This function is a middleware  which retrieves tourId from req.params
 * or req.body and saves its value to req.query.tourId.
 * This is done in order to support the use of APIFeatures class which allows pagination
 * and filtering
 *
 * The tourId in req.query is used in Model.find({...req.query}) which returns reviews
 * of a selected tour but with features such as advanced filtering
 */
exports.addTourIdToQuery = (req, res, next) => {
  //allow nested routes {/tours/:id/reviews}
  const tourIdFromReq = req.body.tourId;
  const tourIdFromParams = req.params.tourId;
  const tourId = tourIdFromReq !== undefined ? tourIdFromReq : tourIdFromParams;
  req.query.tourId = tourId;
  next();
};
exports.addReview = createResource(Review, [
  'userId',
  'tourId',
  'text',
  'rating',
]);
exports.getReviewById = getResourceById(Review);
