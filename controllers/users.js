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
