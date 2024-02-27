const Review = require('../models/reviewModel');
const { filterObject } = require('../utils/functions');

exports.getAllReviews = async (req, res) => {
  const { id } = req.params;
  try {
    const reviews = await Review.find({ tourId: id });
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
    const { id } = req.params;
    const allowedKeys = ['rating', 'text', 'userId', 'tourId'];

    //All the keys: value pairs that are not in the array are deleted from the object
    const filteredObject = filterObject(
      //assign the value of user._id which is generated while
      //authenticating user up in the middleware stack to userId to be used in newReview document
      { ...req.body, userId: req.user._id, tourId: id },
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
