const express = require('express');

const {
  getTourById,
  getTours,
  addTour,
  aliasTopFiveTours,
  getToursStats,
  getMonthlyPlan,
  deleteTour,
  updateTour,
} = require(`../controllers/tours`);
const { modifyQueryToFilterObjSyntax } = require('../utils/functions');
const { isLoggedIn, allowAccessTo } = require('../controllers/auth');
const reviewRouter = require('./review');

const router = express.Router();
router.route('/').get(modifyQueryToFilterObjSyntax, getTours).post(addTour);
router.route('/top-five-tours').get(aliasTopFiveTours, getTours);
router.route('/stats').get(getToursStats);
router.route('/monthly-plan/:year').get(getMonthlyPlan);
router
  .route('/:id')
  .get(getTourById)
  .patch(updateTour)
  .delete(isLoggedIn, allowAccessTo('admin', 'lead-guide'), deleteTour);

router.use('/:tourId/reviews', reviewRouter);
router.use('/:tourId/reviews/:id', reviewRouter);
module.exports = router;
