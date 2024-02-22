const express = require('express');
const {
  signup,
  login,
  isLoggedIn,
  allowAccessTo,
  forgotPassword,
  resetPassword,
  changePassword,
} = require('../controllers/auth');
const {
  getAllUsers,
  //  updateUser,
  deleteUser,
  updateMe,
} = require('../controllers/users');
const { modifyQueryToFilterObjSyntax } = require('../utils/functions');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/change-password', isLoggedIn, changePassword);
router
  .route('/')
  .get(isLoggedIn, modifyQueryToFilterObjSyntax, getAllUsers)
  .patch(isLoggedIn, updateMe);
//This Update route for now does not ask user for their previous credentials
//It is being developed temporarily to test if  pre-save hooks change lastPasswordChange in database
//Future enhancement to the delete route will include checking the roles of the users before giving access to the route
router
  .route('/:id')
  // .patch(allowAccessTo('admin'), updateUser)
  .delete(isLoggedIn, allowAccessTo('admin'), deleteUser);
module.exports = router;
