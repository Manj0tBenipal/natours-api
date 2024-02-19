const User = require('../models/userModel');
const { signJWT } = require('../utils/functions');

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
    const token = signJWT(newUser._id);
    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: { name: newUser.name, email: newUser.email, id: newUser._id },
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

    const user = await User.findOne({ email: email }).select('+password');
    if (!user) {
      throw new Error('Authentication failed!. Incorrect email or passowrd');
    }
    /**
     *compare the encryped password with the one provided by user
     *The .passwordMatch() is an instance mathod available on all the documents of User model
     */
    const passwordMatch = await user.passwordMatch(password, user.password);

    //Error is thrown on password mismatch
    if (!passwordMatch)
      throw new Error('Authentication failed!. Incorrect email or passowrd');

    const token = signJWT(user._id);
    // A sucess res is sent when all the auth steps are completed
    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: { name: user.name, email: user.email, id: user._id },
      },
    });
  } catch (err) {
    res.status(500).json({
      status: 'failed',
      err: err.message,
    });
  }
};
