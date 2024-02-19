const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
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
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE,
    });
    res.status(201).json({
      status: 'success',
      token,
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

/**
 * Logging in users,
 * confirm if the user exists,
 * if yes: Match the passwords
 *    a. if match, create a new JWT, sign it and send to user
 *    b. if no match: throw error
 * if No: return error
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    /**
     * if email or password is not provided throw nre Error
     */
    if (!email || !password) throw new Error('email or password not provided');

    const user = await User.findOne({ email: email });
    if (!user) {
      throw new Error('User does not exist');
    }

    //compare the encryped password with the one provided by user
    const passwordMatch = await bcrypt.compare(password, user.password);

    //Error is thrown on password mismatch
    if (!passwordMatch)
      throw new Error('Authentication failed!. Incorrect passowrd');

    // A sucess res is sent when all the auth steps are completed
    res.status(201).json({
      status: 'success',
      data: {
        user: user,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: 'failed',
      err: err.message,
    });
  }
};
