const express = require('express');

const tourController = require(`../controllers/tours`);
const reviewController = require('../controllers/review');
const { modifyQueryToFilterObjSyntax } = require('../utils/functions');
const { isLoggedIn, allowAccessTo } = require('../controllers/auth');

const router = express.Router();
router
  .route('/')
  .get(modifyQueryToFilterObjSyntax, tourController.getTours)
  .post(tourController.addTour);
router
  .route('/top-five-tours')
  .get(tourController.aliasTopFiveTours, tourController.getTours);
router.route('/stats').get(tourController.getToursStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);
router
  .route('/:id')
  .get(tourController.getTourById)
  .patch(tourController.updateTour)
  .delete(
    isLoggedIn,
    allowAccessTo('admin', 'lead-guide'),
    tourController.deleteTour,
  );

router
  .route('/:id/reviews')
  .get(reviewController.getAllReviews)
  .post(isLoggedIn, allowAccessTo('customer'), reviewController.addReview);
router.route('/:id/reviews/:reviewId').get(reviewController.getReviewById);
module.exports = router;
