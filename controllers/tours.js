const Tour = require('../models/tourModel');
const { APIFeatures } = require('../utils/APIFeatures');

exports.getTours = async (req, res) => {
  try {
    const fetchTours = new APIFeatures(Tour, req.query);

    const tours = await fetchTours.execute();
    res.status(200).json({
      status: 'success',
      ...tours,
    });
  } catch (err) {
    res.status(500).json({
      err: {
        type: err.name,
        message: err.message,
      },
      status: 'fail',
      message: 'falied to get Documents',
    });
  }
};
exports.getTourById = async (req, res) => {
  const { params } = req;
  try {
    const tour = await Tour.findById(`${params.id}`);
    if (!tour) {
      throw new Error('404');
    }
    res.status(200).json({ status: 'success', data: tour });
  } catch (err) {
    const status = err.message === '404' ? 404 : 400;

    res.status(status).json({
      status: 'fail',
      err:
        status === 400 ? 'Document id is invalid ' : 'Document does not exist',
    });
  }
};

exports.addTour = async (req, res) => {
  const { body } = req;
  try {
    const data = await Tour.create({
      ...body,
    });
    res.status(201).json({ status: 'suceess', data: { data } });
  } catch (err) {
    res.status(400).json({
      err: {
        type: err.name,
        message: err.message,
      },
      status: 'fail',
      message: 'falied to save document',
    });
  }
};
exports.updateTour = async (req, res) => {
  const { params, body } = req;
  try {
    const data = await Tour.updateOne(
      { _id: params.id },
      { $set: { ...body } },
    );
    if (data.matchedCount === 0) {
      throw new Error('400');
    }
    res.status(200).json({
      status: 'success',
      data: {
        data,
      },
    });
  } catch (err) {
    const status = err.message === '400' ? 400 : 500;
    res.status(status).json({
      status: 'fail',
      err:
        status === 400
          ? 'Document not found'
          : {
              type: err.name,
              message: err.message,
            },
    });
  }
};
exports.deleteTour = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await Tour.deleteOne({ _id: id });
    if (data.deletedCount === 0) {
      throw new Error('400');
    }
    res.status(204).json({
      status: 'success',
      data: { data },
    });
  } catch (err) {
    const status = err.message === '400' ? 400 : 500;
    res.status(status).json({
      status: 'fail',
      err:
        status === 400
          ? 'Document does not exist'
          : 'failed to delete document',
    });
  }
};

exports.aliasTopFiveTours = (req, res, next) => {
  req.query = { limit: '5', sort: 'ratingsAverage' };
  next();
};
