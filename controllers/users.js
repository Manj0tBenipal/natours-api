const User = require('../models/userModel');
const APIFeatures = require('../utils/APIFeatures');

exports.getAllUsers = async (req, res) => {
  try {
    const fetchUsers = new APIFeatures(User, req.query);
    const users = await fetchUsers.execute();
    res.status(200).json({
      status: 'success',
      ...users,
    });
  } catch (err) {
    res.status(500).json({
      status: 'failed',
      err,
    });
  }
};
exports.updateUser = async (req, res) => {
  try {
    const { params, body } = req;
    if (!params.id) throw new Error('Provide a userID');
    //future enhancement will sanitize the incoming object to filter unnecessary fields
    const updatedUser = await User.findOneAndUpdate(
      { _id: params.id },
      { $set: { ...body } },
      { new: true },
    );
    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: 'failed',
      err: err.message,
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) throw new Error('Invalid UserID');
    const user = await User.findOneAndDelete({ _id: id });
    if (!user) throw new Error('Invalid UserID');
    res.status(200).json({
      status: 'success',
      data: {
        deletedUser: user._id,
      },
    });
  } catch (err) {
    res.status(401).json({
      status: 'failed',
      err: err.message,
    });
  }
};
