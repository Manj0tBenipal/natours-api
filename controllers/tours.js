const Tour = require('../models/tourModel');
const {
  getResourceById,
  deleteResourceById,
  updateResource,
  createResource,
  getResources,
} = require('./handlerFactory');

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

exports.getToursStats = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(500).json({
      status: 'fail',
      err: err,
    });
  }
};
exports.getMonthlyPlan = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(500).json({
      status: 'fail',
      err: err,
    });
  }
};
