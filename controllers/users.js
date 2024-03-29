const User = require('../models/userModel');
const AppError = require('../utils/AppError');

const { signJWT, catchAsync } = require('../utils/functions');
const {
  deleteResourceById,
  updateResource,
  getResources,
  getResourceById,
} = require('./handlerFactory');

exports.getUserById = getResourceById(User, {
  select: ['+photo', '+role', '+active'],
});
exports.getAllUsers = getResources(User);
exports.updateUser = updateResource(User, [
  'name',
  'email',
  'role',
  'active',
  'photo',
]);
exports.deleteUser = deleteResourceById(User);
exports.addUserIdToParams = (req, res, next) => {
  req.params.id = req.user._id;
  next();
};
exports.getMe = getResourceById(User);
exports.updateMe = catchAsync(async (req, res) => {
  //User needs to successfully pass isLoggedIn middleware to update name and email
  //isLoggedIn then will add a user Object to the query
  const { user } = req;

  //only allow updating name and email
  //password is updated with a different route handler
  const { name, email } = req.body;

  //either name or email should be in the req body
  if (!name && !email) throw new AppError('Insufficient Data!', 400);
  user.name = name;
  user.email = email;
  await user.save();
  res.status(200).json({
    status: 'success',
    data: {
      updatedUser: user._id,
    },
  });
});

exports.deactivateAccount = catchAsync(async (req, res) => {
  //isLoggedIn middleware needs to be executed successfully
  //to access this route handler. isLoggedIn also adds the user object
  //of the user currently logged in to the reqest object
  const user = await User.findById(req.user._id).select('+password');

  //deactivating account requires user to send currentPassword inthe request body
  const { password } = req.body;
  if (!password)
    throw new AppError('Password is required to deactivate the account!', 401);

  //check if the user has entered the correct password
  if (!(await user.passwordMatch(password, user.password)))
    throw new AppError('Authentication failed! Incorrect Password!', 401);
  //if user is authenticated successfully deactivate the account

  user.active = false;
  //Since the value of activate is set to false by the routeHandler
  //not the user, validation is not required
  await user.save({
    validateBeforeSave: false,
  });

  res.status(200).json({
    status: 'failed',
    data: {
      deactivateUser: user._id,
    },
  });
});
exports.activateAccount = catchAsync(async (req, res) => {
  //retrieve credentials from req.body
  const { email, password } = req.body;

  //check if both email and password are provided in req.body
  if (!email || !password) throw new AppError('Insufficient Data!', 400);

  //find the user based on email address
  /**
   * NOTE: there is a middleware which executes before each find query
   */
  const user = await User.findOne({
    email: email,
    includeInactive: true,
  }).select('+password +active');

  //check if with same email is found
  if (!user) throw new AppError('Invalid Username or password', 401);

  //verify the credentials
  if (!(await user.passwordMatch(password, user.password)))
    throw new AppError('Invalid Username or password', 401);
  if (user.active)
    throw new AppError('Your account is already active! Please login', 400);
  //change status of account from inactive to active
  user.active = true;

  //save changes
  await user.save({
    validateBeforeSave: false,
  });

  //create a new JWT and attach it to the res object as a cookie
  signJWT(user._id, res);
  res.status(200).json({
    status: 'success',
    data: {
      activatedUser: user._id,
    },
  });
});
