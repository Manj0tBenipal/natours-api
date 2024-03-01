const Review = require('../models/reviewModel');
const User = require('../models/userModel');
const {
  getResourceById,
  createResource,
  getResources,
  deleteResourceById,
  updateResource,
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
exports.deleteReview = deleteResourceById(Review);
exports.updateReview = updateResource(Review, ['text', 'rating']);
/**
 * This function is a middleware used for verifying ownership of a Review document
 * This verification is required when a review is being updated or deleted.
 *
 * The id of currently loggedIn user should match the userId in the review document
 * being updated or deleted
 * @param req
 * @param res
 * @param next
 */
exports.verifyUserForOwnership = async (req, res, next) => {
  try {
    const { user } = req;
    const { id } = req.params;
    const userDoc = await User.findById(user._id).select('+role');
    const review = await Review.findById(id);
    if (!review) throw new Error('No review Found!');
    //check if the user is owner of the review
    //if not, check if admin is performing the action
    if (!review.userId.equals(user._id))
      if (userDoc.role !== 'admin')
        throw new Error('You are not allowed to perform this action');
    next();
  } catch (err) {
    res.status(401).json({
      status: 'failed',
      err: err.message,
    });
  }
};
