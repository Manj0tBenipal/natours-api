const User = require('../models/userModel');

exports.signup = async (req, res) => {
  try {
    const newUser = await User.create(...req.body);
    console.log(newUser);
    res.status(201).json({
      status: 'success',
      data: {
        user: newUser,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: 'failed',
      err: {
        err,
      },
    });
  }
};
