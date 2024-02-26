const express = require('express');
const { getAllReviews, addReview } = require('../controllers/review');
const { isLoggedIn, allowAccessTo } = require('../controllers/auth');

const router = express.Router();
router
  .route('/')
  .get(getAllReviews)
  .post(isLoggedIn, allowAccessTo('customer'), addReview);
module.exports = router;
