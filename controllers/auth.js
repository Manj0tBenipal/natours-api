const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/userModel');
const { signJWT } = require('../utils/functions');
const sendEmail = require('../utils/email');

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
 * confirm if the user exists, if No: return error
 * if yes: Match the passwords
 *    a. if match, create a new JWT, sign it and send to user
 *    b. if no match: throw error
 *
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
    const { id, iat } = await new Promise((resolve, reject) => {
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
    const user = await User.findById(id).select('+role');
    if (!user) {
      statusCode = 401;
      throw new Error('Invalid User!');
    }
    if (user.passwordChangedAfter(iat))
      throw new Error('Your password was changed! You need to login again');
    req.user = user;
    next();
  } catch (err) {
    return res.status(statusCode).json({
      status: 'failed',
      message: err.message,
      stack: err,
    });
  }
};

/**
 * This function is a wrapper around middleware function which accepts one or more
 * String arguments which are user roles.
 * These roles are then used inside of middleware function to check if the user accessing
 * the route has a matching role.
 * If the user's role is in the allowedRoles then the req is passed down to the middleware stack
 * if the user's role is not in allowedRoles an error response is sent
 * @param  {...String} roles
 * @returns a middleware function that handles the access to route
 */
exports.allowAccessTo =
  (...allowedRoles) =>
  (req, res, next) => {
    try {
      const userRole = req.user.role;
      if (!allowedRoles.includes(userRole))
        throw new Error('Access restricted');
      next();
    } catch (err) {
      res.status(401).json({
        status: 'failed',
        err: err.message,
      });
    }
  };

exports.forgotPassword = async (req, res) => {
  try {
    /**
     * find the user by the email
     * if either email is not provided or none of the users in the
     * database have the same email as the one specified in request then
     * throw an error
     */
    const { email } = req.body;
    if (!email) throw new Error('Invalid Email');
    const user = await User.findOne({ email: email }).select(
      '+passwordResetToken +passwordResetTokenExpire',
    );
    if (!user) throw new Error('User does not exist');

    //Generate a new random passsword reset token and store hashed version of
    //it in the database
    const passResetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    const dynamicURL = `${process.env.APP_URL}:${process.env.PORT}/users/reset-password/${passResetToken}`;
    /**
     * In case there is an error sending the email:
     * delete passwordResetToken and passwordResetTokenExpire
     * pass down err to parent try catch which completes the req, res cycle
     */
    try {
      await sendEmail({
        email: req.body.email,
        subject: `Your password reset token`,
        text: dynamicURL,
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetTokenExpire = undefined;
      user.save();
      throw new Error(err);
    }
    res.status(200).json({
      status: 'success',
      message: 'email sent',
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      err: err.message,
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    // Get the token from link and create the hash using the same algorithm
    //that was used to hash it at time of generating it
    const { token } = req.params;
    if (!token) throw new Error('Invalid password reset link');
    /**
     * retrieve password and passwordConfirm from the request body
     * if either password or passwordCOnfirm is not present throw an error
     * In case of a mismatch between password and passwordConfirm throw an error
     */
    const { password, passwordConfirm } = req.body;
    if (!password || !passwordConfirm) throw new Error('Insufficient data');
    if (password !== passwordConfirm) throw new Error('password mismatch!');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    //Search for the user who has the same hash stored in passwordResetToken
    const user = await User.findOne({ passwordResetToken: hashedToken }).select(
      '+passwordResetTokenExpire +passwordResetToken',
    );

    //If there is no match found the token is invalid
    if (!user) throw new Error('Invalid or expired password reset link');
    /**
     * Check if the token has expired:
     * if yes: then delete the token and expiry and throw an errors
     */
    if (parseInt(user.passwordResetTokenExpire.getTime()) < Date.now()) {
      user.passwordResetToken = undefined;
      user.passwordResetTokenExpire = undefined;
      throw new Error('The link has expired');
    }
    //this password is plain text which gets encrypted in a pre-save hook
    user.password = password;
    await user.save();
    //if the password is saved without any errors the token and its expiry are deleted
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpire = undefined;
    await user.save();
    res.status(200).json({
      status: 'success',
      data: {
        userUpdates: user._id,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      err: err.message,
    });
  }
};
