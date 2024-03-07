const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/userModel');
const { signJWT, catchAsync } = require('../utils/functions');
const sendEmail = require('../utils/email');
const AppError = require('../utils/AppError');

exports.signup = catchAsync(async (req, res) => {
  const userData = req.body;
  const newUser = await User.create({
    name: userData.name,
    email: userData.email,
    password: userData.password,
    passwordConfirm: userData.passwordConfirm,
    photo: userData.photo,
  });
  const token = signJWT(newUser._id, res);
  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: { name: newUser.name, email: newUser.email, id: newUser._id },
    },
  });
});

/**
 * Logging in users,
 * confirm if the user exists, if No: return error
 * if yes: Match the passwords
 *    a. if match, create a new JWT, sign it and send to user
 *    b. if no match: throw error
 *
 */
exports.login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  /*
   * if email or password is not provided throw nre Error
   */
  if (!email || !password)
    throw new AppError('email or password not provided', 400);

  const user = await User.findOne({ email: email }).select('+password +photo');
  if (!user) {
    throw new AppError(
      'Authentication failed!. Incorrect email or password',
      401,
    );
  }
  /*
   *compare the encrypted password with the one provided by user
   *The .passwordMatch() is an instance mathod available on all the documents of User model
   */
  const passwordMatch = await user.passwordMatch(password, user.password);

  //Error is thrown on password mismatch
  if (!passwordMatch)
    throw new AppError(
      'Authentication failed!. Incorrect email or password',
      401,
    );
  const token = signJWT(user._id, res);
  // A sucess res is sent when all the auth steps are completed
  res.status(200).json({
    status: 'success',
    token,
    data: {
      user: {
        name: user.name,
        email: user.email,
        id: user._id,
        photo: user.photo,
      },
    },
  });
});

exports.isLoggedIn = catchAsync(async (req, res, next) => {
  let { session } = req.cookies;
  //if there is no session cookie check for the JWT in auth headers
  if (!session) {
    //--CHECKING IF JWT IS PRESENT IN HEADERS
    const { headers } = req;
    const authHeader = headers.authorization;
    //if 'authorization' is not present in headers -> user is not logged in
    //Access to the protected route is denied
    if (!authHeader || !authHeader.startsWith('Bearer'))
      throw new AppError('You are not logged in', 401);

    //remove the prefix of Bearer from the token
    session = authHeader.split(' ')[1];
    if (!session) throw new AppError('You are not logged in', 401);
  }

  //---VERIFYING JWT---
  /*
   * Promisify the async version of jwt.verify()
   * and await the resolved token
   *
   * If token is found to be invalid promise will be rejected and
   * code will fallback to the catch block which will send a 'failed' respose
   */
  const { id, iat } = await new Promise((resolve, reject) => {
    jwt.verify(session, process.env.JWT_SECRET, (err, decoded) => {
      if (err) reject(err);
      resolve(decoded);
    });
  });

  //---- VERYFYING THE PAYLOAD FOR USER DETAILS-----
  //if token does not contain 'id' field the payload has been modifies
  //in which case Error is thrown
  if (!id) throw new AppError('Invalid credentials', 401);

  //Check if the user exists using the id from payload
  //if not throw an Error
  const user = await User.findById(id).select('+active');
  if (!user) throw new AppError('Invalid User!', 401);

  //check if the account is deactivated
  if (!user.active)
    throw new AppError(
      `Account has been deactivated!.Login again to activate`,
      403,
    );
  if (user.passwordChangedAfter(iat))
    throw new AppError(
      'Your password was changed! You need to login again',
      403,
    );
  req.user = user;
  next();
});

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
exports.allowAccessTo = (...allowedRoles) =>
  catchAsync(async (req, res, next) => {
    const { role } = await User.findById(req.user._id).select('+role');
    if (!allowedRoles.includes(role))
      throw new AppError('Access restricted', 403);
    next();
  });

exports.forgotPassword = catchAsync(async (req, res) => {
  /*
   * find the user by the email
   * if either email is not provided or none of the users in the
   * database have the same email as the one specified in request then
   * throw an error
   */
  const { email } = req.body;
  if (!email) throw new AppError('Invalid Email', 401);
  const user = await User.findOne({ email: email }).select(
    '+passwordResetToken +passwordResetTokenExpire',
  );
  if (!user) throw new AppError('User does not exist', 401);

  //Generate a new random password reset token and store hashed version of
  //it in the database
  const passResetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  const dynamicURL = `${process.env.APP_URL}:${process.env.PORT}/users/reset-password/${passResetToken}`;
  /*
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
    throw new AppError(err, 500);
  }
  res.status(200).json({
    status: 'success',
    message: 'email sent',
  });
});

exports.resetPassword = catchAsync(async (req, res) => {
  // Get the token from link and create the hash using the same algorithm
  //that was used to hash it at time of generating it
  const { token } = req.params;
  if (!token) throw new Error('Invalid password reset link');
  /*
   * retrieve password and passwordConfirm from the request body
   * if either password or passwordCOnfirm is not present throw an error
   * In case of a mismatch between password and passwordConfirm throw an error
   */
  const { password, passwordConfirm } = req.body;
  if (!password || !passwordConfirm)
    throw new AppError('Insufficient data', 400);
  if (password !== passwordConfirm)
    throw new AppError('password mismatch!', 400);
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  //Search for the user who has the same hash stored in passwordResetToken
  const user = await User.findOne({ passwordResetToken: hashedToken }).select(
    '+passwordResetTokenExpire +passwordResetToken',
  );

  //If there is no match found the token is invalid
  if (!user) throw new AppError('Invalid or expired password reset link', 401);
  /**
   * Check if the token has expired:
   * if yes: then delete the token and expiry and throw an errors
   */
  if (parseInt(user.passwordResetTokenExpire.getTime()) < Date.now()) {
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpire = undefined;
    throw new AppError('The link has expired', 404);
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
});

exports.changePassword = catchAsync(async (req, res) => {
  //isLoggedIn route handler is executed before changePassword
  //on successfull login the isLoggedIn route handler adds user object to the request
  //if the user was not logged in the response will be sent before reaching this middleware
  const user = await User.findOne({ _id: req.user._id }).select('+password');

  //retrieve the old password, new password, and a confirmation for new password
  const { newPassword, newPasswordConfirm, currentPassword } = req.body;

  //if either of the passswords is not provided throw error
  if (!newPassword || !newPasswordConfirm || !currentPassword)
    throw new AppError('Insufficient data', 400);

  //Compare the  old password with the one stored in database
  if (!(await user.passwordMatch(req.body.currentPassword, user.password)))
    throw new AppError('Your password is incorrect', 401);

  //On successfull authentication save the new password
  //a pre-save hook will encrypt the password before it is saved to db
  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;

  //save the changes
  await user.save();

  res.status(200).json({
    status: 'success',
    data: {
      updatedUser: user._id,
    },
  });
});

exports.authUsingCookie = catchAsync(async (req, res, next) => {
  const { user } = req;
  res.status(200).json({ isAuthenticated: true, user: user });
});
