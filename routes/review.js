const express = require('express');
const {
  getAllReviews,
  addReview,
  getReviewById,
} = require('../controllers/review');
const { isLoggedIn, allowAccessTo } = require('../controllers/auth');

const router = express.Router({ mergeParams: true });
router
  .route('/')
  .get(getAllReviews)
  .post(isLoggedIn, allowAccessTo('customer'), addReview);
router.route('/:id').get(getReviewById);
module.exports = router;
