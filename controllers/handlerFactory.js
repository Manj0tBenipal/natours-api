const APIFeatures = require('../utils/APIFeatures');
const { filterObject, catchAsync } = require('../utils/functions');
const AppError = require('../utils/AppError');
/**
 * This function returns all the documents in a collection
 * The results are filtered using methods in APIFeatures class
 * @param {Mongoose.model} Model
 */
exports.getResources = (Model) =>
  catchAsync(async (req, res, next) => {
    const query = new APIFeatures(Model, req.query);
    const docs = await query.execute();
    res.status(200).json({
      status: 'success',
      ...docs,
    });
  });
/**
 * This function fetches a document from the given Model using document id
 * provided in req.params
 * @param {Mongoose.model} Model
 * @param {any} options the virtual fields that a user wants to populate
 */
exports.getResourceById = (Model, options = {}) =>
  catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const query = Model.findById(id);
    if (options.populate) query.populate({ ...options.populate });
    const doc = await query;
    if (!doc) {
      throw new AppError('No documents found', 400);
    }
    res.status(200).json({
      status: 'success',
      data: { [Model.modelName.toLowerCase()]: doc },
    });
  });

/**
 * This function deletes a document from the provided Model using the document id
 * from req.params
 * @param {Mongoose.model} Model
 */
exports.deleteResourceById = (Model) =>
  catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const doc = await Model.findOneAndDelete({ _id: id });
    if (!doc) throw new AppError('Invalid DocumentID', 400);
    res.status(200).json({
      status: 'success',
      data: {
        deletedDoc: doc._id,
      },
    });
  });

/**
 * This function updates a resource in provided model using  data from req.body
 * The data is filtered using the allowedKeysArray
 * @param {Mongoose.model} Model
 * @param {String[]} allowedKeys
 */
exports.updateResource = (Model, allowedKeys) =>
  catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const updatedData = filterObject(req.body, allowedKeys);

    const data = await Model.findOneAndUpdate(
      { _id: id },
      { $set: { ...updatedData } },
      { runValidators: true, new: true },
    );
    if (data.matchedCount === 0) throw new AppError('Invalid DocumentId', 400);

    res.status(200).json({
      status: 'success',
      data: {
        data,
      },
    });
  });
/**
 * This method creates a new document using the data provided in the req.body
 * The incoming data is filtered based on the provided array of allowedKeys
 * @param {Mongoose.model} Model
 * @param {String[]} allowedKeys only object keys specified in this array are allowed to be added into db
 */
exports.createResource = (Model, allowedKeys) =>
  catchAsync(async (req, res, next) => {
    const { body } = req;
    const data = await Model.create({
      ...filterObject(body, allowedKeys),
    });
    res.status(201).json({ status: 'success', data: { data } });
  });
