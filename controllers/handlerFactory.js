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
