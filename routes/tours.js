const express = require('express');
const { modifyQueryToFilterObjSyntax } = require('../utils/functions');

const router = express.Router();
const controller = require(`../controllers/tours`);
router
  .route('/')
  .get(modifyQueryToFilterObjSyntax, controller.getTours)
  .post(controller.addTour);
router
  .route('/top-five-tours')
  .get(controller.aliasTopFiveTours, controller.getTours);
router
  .route('/:id')
  .get(controller.getTourById)
  .patch(controller.updateTour)
  .delete(controller.deleteTour);
module.exports = router;
