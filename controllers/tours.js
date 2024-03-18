const Tour = require('../models/tourModel');
const AppError = require('../utils/AppError');

const {
  getResourceById,
  deleteResourceById,
  updateResource,
  createResource,
  getResources,
} = require('./handlerFactory');
const { catchAsync } = require('../utils/functions');

const allowedKeys = [
  'name',
  'price',
  'duration',
  'difficulty',
  'summary',
  'description',
  'imageCover',
  'images',
  'startDates',
  'locations',
  'guides',
];
exports.getTours = getResources(Tour);
exports.getTourById = getResourceById(Tour);
exports.addTour = createResource(Tour, allowedKeys);
exports.updateTour = updateResource(Tour, allowedKeys);
exports.deleteTour = deleteResourceById(Tour);

exports.aliasTopFiveTours = (req, res, next) => {
  req.query = { limit: '5', sort: 'ratingsAverage' };
  next();
};

exports.getToursStats = catchAsync(async (req, res) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 1 } },
    },
    {
      $group: {
        _id: '$difficulty',
        totalTours: { $sum: 1 },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
      },
    },
    {
      $sort: {
        avgPrice: -1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: { stats },
  });
});
exports.getMonthlyPlan = catchAsync(async (req, res) => {
  const { year } = req.params;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        count: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: {
        month: '$_id',
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        month: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: { plan },
  });
});
/**
 *This route handler accepts distance range, user's location and the unit of distance
 * as a param in request and returns all the available tours that are within the provided
 * distance from user's location
 * The url structure looks like: /tours/within/:distance/center/:latlong/unit/:unit
 */
exports.getToursWithin = catchAsync(async (req, res) => {
  const { distance, latlong, unit } = req.params;
  const [lat, long] = latlong.split(',');
  if (!lat || !long)
    throw new AppError('Please provide location in format: lat,long', 400);

  //calculating the distance is radians by dividing it with the radius of earth,
  //radians are calculated based on the unit provided in the params
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[long, lat], radius] } },
  });
  res.status(200).json({
    status: 'success',
    data: {
      tours,
    },
  });
});
