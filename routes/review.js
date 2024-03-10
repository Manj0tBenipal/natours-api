const express = require('express');
const {
  getAllReviews,
  addReview,
  getReviewById,
  addTourAndUserId,
  addTourIdToQuery,
  deleteReview,
  verifyUserForOwnership,
  updateReview,
} = require('../controllers/review');
const { isLoggedIn, allowAccessTo } = require('../controllers/auth');

const router = express.Router({ mergeParams: true });
router
  .route('/')
  .get(addTourIdToQuery, getAllReviews)
  //addTourAndUserId adds userId from req.user to req.body.userId
  //and if tourId is not provided in req.body, it assigns it from req.params
  //Thi is done to support adding review using nested routed and normal POST /reviews route
  .post(isLoggedIn, allowAccessTo('user'), addTourAndUserId, addReview);

router.use(isLoggedIn);
router.get('/:id', getReviewById);
router.use('/:id', allowAccessTo('admin', 'customer'), verifyUserForOwnership);
router.route('/:id').delete(deleteReview).patch(updateReview);
module.exports = router;
