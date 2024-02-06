const express = require('express');
const { modifyQueryToFilterObjSyntax } = require('../utils');

const router = express.Router();
const controller = require(`../controllers/tours`);
router
  .route('/')
  .get(modifyQueryToFilterObjSyntax, controller.getTours)
  .post(controller.addTour);
router
  .route('/:id')
  .get(controller.getTourById)
  .patch(controller.updateTour)
  .delete(controller.deleteTour);
module.exports = router;
