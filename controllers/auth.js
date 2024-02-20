const jwt = require('jsonwebtoken');
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

exports.isLoggedIn = async (req, res, next) => {
  //this variable is used in catch block to send different status codes
  //in response according to the reason for error
  let statusCode = 200;
  try {
    //--CHECKING IF JWT IS PRESENT IN HEADERS
    const { headers } = req;
    const authHeader = headers.authorization;
    //if 'authorization' is not present in headers -> user is not logged in
    //Access to the protected route is denied
    if (!authHeader || !authHeader.startsWith('Bearer')) {
      statusCode = 401;
      throw new Error('You are not logged in');
    }
    //remove the prefix of Bearer from the token
    const token = authHeader.split(' ')[1];
    if (!token) {
      statusCode = 401;
      throw new Error('You are not logged in');
    }

    //---VERIFYING JWT---
    /**
     * Promisify the async version of jwt.verify()
     * and await the resolved token
     *
     * If token is found to be invalid promise will be rejected and
     * code will fallbak to the catch block which will send a 'failed' respose
     */
    const { id } = await new Promise((resolve, reject) => {
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) reject(err);
        resolve(decoded);
      });
    });

    //---- VERYFYING THE PAYLOAD FOR USER DETAILS-----
    //if token does not contain 'id' field the payload has been modifies
    //in which case Error is thrown
    if (!id) {
      statusCode = 401;
      throw new Error('Invalid credentails');
    }

    //Check if the user exists using the id from payload
    //if not throw an Error
    const user = await User.findById(id);
    if (!user) {
      statusCode = 401;
      throw new Error('Invalid User!');
    }
    console.log(user);
    next();
  } catch (err) {
    return res.status(statusCode).json({
      status: 'failed',
      message: err.message,
      stack: err,
    });
  }
};
