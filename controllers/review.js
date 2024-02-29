const Review = require('../models/reviewModel');
const { getResourceById, createResource } = require('./handlerFactory');

exports.getAllReviews = async (req, res) => {
  //allow nested routes {/tours/:id/reviews}
  const tourIdFromReq = req.body.tourId;
  const tourIdFromParams = req.params.tourId;
  const tourId = tourIdFromReq !== undefined ? tourIdFromReq : tourIdFromParams;
  try {
    const reviews = await Review.find({ tourId: tourId });
    res.status(200).json({
      status: 'success',
      data: {
        reviews: reviews,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: 'failed',
      err: err.message,
    });
  }
};
exports.addTourAndUserId = (req, res, next) => {
  const tourIdFromParams = req.params.tourId;
  if (!req.body.tourId) req.body.tourId = tourIdFromParams;
  req.body.userId = req.user._id;
  next();
};

exports.getReviewById = getResourceById(Review);
