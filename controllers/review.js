const Review = require('../models/reviewModel');
const { filterObject } = require('../utils/functions');

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
exports.addReview = async (req, res) => {
  try {
    //allow nested routes {/tours/:id/reviews}
    const tourIdFromReq = req.body.tourId;
    const tourIdFromParams = req.params.tourId;
    const tourId =
      tourIdFromReq !== undefined ? tourIdFromReq : tourIdFromParams;
    const allowedKeys = ['rating', 'text', 'userId', 'tourId'];

    //All the keys: value pairs that are not in the array are deleted from the object
    const filteredObject = filterObject(
      //assign the value of user._id which is generated while
      //authenticating user up in the middleware stack to userId to be used in newReview document
      { ...req.body, userId: req.user._id, tourId: tourId },
      allowedKeys,
    );

    const newReview = await Review.create(filteredObject);
    res.status(201).json({
      status: 'success',
      data: {
        newReview: newReview,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: 'failed',
      err: err.message,
    });
  }
};
exports.getReviewById = async (req, res) => {
  try {
    //allow nested routes {/tours/:id/reviews}
    const tourIdFromReq = req.body.tourId;
    const tourIdFromParams = req.params.tourId;
    const tourId =
      tourIdFromReq !== undefined ? tourIdFromReq : tourIdFromParams;

    const { reviewId } = req.params;
    const review = await Review.findOne({ _id: reviewId, tourId: tourId });
    if (!review) throw new Error('No review found');
    res.status(200).json({
      status: 'success',
      data: {
        review,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: 'failed',
      err: err.message,
    });
  }
};
