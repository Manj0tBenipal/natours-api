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
exports.updateMe = async (req, res) => {
  try {
    //User needs to successfully pass isLoggedIn middleware to update name and email
    //isLoggedIn then will add a user Object to the query
    const { user } = req;

    //only allow updating name and email
    //password is updated with a different route handler
    const { name, email } = req.body;

    //either name or email should be in the req body
    if (!name && !email) throw new Error('Insufficient Data!');
    user.name = name;
    user.email = email;
    await user.save();
    res.status(200).json({
      status: 'success',
      data: {
        updatedUser: user._id,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: 'failed',
      err: { ...err },
    });
  }
};

exports.deactivateAccount = async (req, res) => {
  try {
    //isLoggedIn middleware needs to be executed successfully
    //to access this route handler. isLoggedIn also adds the user object
    //of the user currently logged in to the reqest object

    const user = await User.findById(req.user._id).select('+password');
    //deactivating account requires user to send currentPassword inthe request body
    const { password } = req.body;
    if (!password)
      throw new Error('Password is required to deactivate the account!');

    //check if the user has entered the correct password
    if (!(await user.passwordMatch(password, user.password)))
      throw new Error('Authentication failed! Incorrect Password!');
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
  } catch (err) {
    res.status(500).json({
      status: 'failed',
      err: err.message,
    });
  }
};
