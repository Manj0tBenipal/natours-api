const express = require('express');
const {
  getAllReviews,
  addReview,
  getReviewById,
  addTourAndUserId,
} = require('../controllers/review');
const { isLoggedIn, allowAccessTo } = require('../controllers/auth');

const router = express.Router({ mergeParams: true });
router
  .route('/')
  .get(getAllReviews)
  //addTourAndUserId adds userId from req.user to req.body.userId
  //and if tourId is not provided in req.body, it assigns it from req.params
  //Thi is done to support adding review using nested routed and normal POST /reviews route
  .post(isLoggedIn, allowAccessTo('customer'), addTourAndUserId, addReview);
router.route('/:id').get(getReviewById);
module.exports = router;
