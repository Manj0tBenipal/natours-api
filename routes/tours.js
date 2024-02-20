const express = require('express');
const { modifyQueryToFilterObjSyntax } = require('../utils/functions');

const router = express.Router();
const controller = require(`../controllers/tours`);
const { isLoggedIn, allowAccessTo } = require('../controllers/auth');
router
  .route('/')
  .get(modifyQueryToFilterObjSyntax, controller.getTours)
  .post(controller.addTour);
router
  .route('/top-five-tours')
  .get(controller.aliasTopFiveTours, controller.getTours);
router.route('/stats').get(controller.getToursStats);
router.route('/monthly-plan/:year').get(controller.getMonthlyPlan);
router
  .route('/:id')
  .get(controller.getTourById)
  .patch(controller.updateTour)
  .delete(
    isLoggedIn,
    allowAccessTo('admin', 'lead-guide'),
    controller.deleteTour,
  );
module.exports = router;
