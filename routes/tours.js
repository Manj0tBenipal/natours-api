const express = require('express');

const tourController = require(`../controllers/tours`);
const { modifyQueryToFilterObjSyntax } = require('../utils/functions');
const { isLoggedIn, allowAccessTo } = require('../controllers/auth');
const reviewRouter = require('./review');

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

router.use('/:tourId/reviews', reviewRouter);
router.use('/:tourId/reviews/:reviewId', reviewRouter);
module.exports = router;
