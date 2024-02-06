const Tour = require('../models/tourModel');
const {
  replaceCommaWithSpace,
  getMaxPageCount,
  convertToInteger,
} = require('../utils');

exports.getTours = async (req, res) => {
  //The original query object mutated using a middleware to prepend mongodb operators with '$'
  const urlQueryObj = { ...req.query };

  /**
   * This filtetred object omits parameters that are used by the API
   * but are not compatible with the syntax of mongodb filter object
   */
  const filteredQueryObj = { ...urlQueryObj };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach((field) => {
    delete filteredQueryObj[field];
  });
  try {
    let query = Tour.find(filteredQueryObj);

    //-------------SORTING--------------------------
    if (urlQueryObj.sort) {
      /**
       * The data can be sorted based on mutiple parameters
       * Mongoose's Model.find.sort() method accepts multiple parameters separated by a space
       * The query from URL provides parameters separated by a ","
       * the String.replace() is used to make teh incoming data compatible with the .sort() arguments
       */
      query = query.sort(replaceCommaWithSpace(urlQueryObj.sort));
    }

    //---------FILTERING SPECIFIC FIELDS-------------------
    if (urlQueryObj.fields) {
      query = query.select(replaceCommaWithSpace(urlQueryObj.fields));
    }

    //------------ PER PAGE LIMITS-------------------

    //Default per page limit is set using the environment variable
    let limit = process.env.PER_PAGE_RESULT_COUNT || 15;
    const docCount = await Tour.countDocuments(filteredQueryObj);
    let maxPages = 0;
    //Per Page limit is changed only if query contains limit parameter
    if (urlQueryObj.limit) {
      //limit is validated and is required to be a number
      //In case of an invalid value an error is thrown
      limit = convertToInteger(urlQueryObj.limit);
    }
    /**
     * Max Pages are calculated based on the total number of docs available
     * and the limit set by user or the default limit
     */
    maxPages = getMaxPageCount(docCount, limit);
    query = query.limit(limit);

    //------------- PAGINATION ------------
    //default page number is set to one unless specified in query
    let pageNumber = 1;
    if (urlQueryObj.page) {
      // Page number is validated and is required to be an number
      pageNumber = convertToInteger(urlQueryObj.page);
      if (pageNumber > maxPages) {
        throw new Error('This page does not exist');
      }
    }
    // the limit variable is used to skip documents depending upon the page number provided
    query = query.skip(limit * (pageNumber - 1));

    //--------------EXECUTING THE QUERY----------------
    const tours = await query;
    res.status(200).json({
      status: 'success',
      currentPage: pageNumber,
      pageCount: maxPages,
      results: tours.length,
      data: { tours },
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
