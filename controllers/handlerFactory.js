const { filterObject } = require('../utils/functions');

/**
 * This function fetches a document from the given Model using document id
 * provided in req.params
 * @param {Mongoose.model} Model 

 */
exports.getResourceById = (Model) => async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Model.findById(id);
    if (!doc) {
      throw new Error('404');
    }
    res.status(200).json({
      status: 'success',
      data: { [Model.modelName.toLowerCase()]: doc },
    });
  } catch (err) {
    const status = err.message === '404' ? 404 : 400;

    res.status(status).json({
      status: 'fail',
      err:
        status === 400 ? 'Document id is invalid ' : 'Document does not exist',
    });
  }
};

/**
 * This function deletes a document from the provided Model using the document id
 * from req.params
 * @param {Mongoose.model} Model
 */
exports.deleteResourceById = (Model) => async (req, res) => {
  try {
    const { id } = req.params;
    const user = await Model.findOneAndDelete({ _id: id });
    if (!user) throw new Error('Invalid DocumentID');
    res.status(200).json({
      status: 'success',
      data: {
        deletedDoc: user._id,
      },
    });
  } catch (err) {
    res.status(401).json({
      status: 'failed',
      err: err.message,
    });
  }
};

/**
 * This function ubdates a recource in provided model using  data from req.body
 * The data is filtered using the allowedKeysArray
 * @param {Mongoose.model} Model
 * @param {String[]} allowedKeys
 */
exports.updateResource = (Model, allowedKeys) => async (req, res) => {
  const { id } = req.params;
  const updatedData = filterObject(req.body, allowedKeys);
  try {
    const data = await Model.findOneAndUpdate(
      { _id: id },
      { $set: { ...updatedData } },
      { runValidators: true, new: true },
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
/**
 * This method creates a new document using the data provided in the req.body
 * The incoming data is filtered based on the provided array of allowedKeys
 * @param {Mongoose.model} Model
 * @param {String[]} allowedKeys only object keys specified in this array are allowed to be added into db
 */
exports.createResource = (Model, allowedKeys) => async (req, res) => {
  const { body } = req;
  try {
    const data = await Model.create({
      ...filterObject(body, allowedKeys),
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
