const User = require('../models/userModel');

exports.signup = async (req, res) => {
  try {
    const userData = req.body;
    const newUser = await User.create({
      name: userData.name,
      email: userData.email,
      password: userData.password,
      passwordConfirm: userData.passwordConfirm,
      photo: userData.photo,
    });
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
      err: err.message,
    });
  }
};
