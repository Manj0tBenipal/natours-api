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
//The update and delete user routes will be made avaiable to users with role='admin'
//users with role 'customer' will have routes to deactivate account and update their details
router
  .route('/:id')
  // .patch(allowAccessTo('admin'), updateUser)
  .delete(isLoggedIn, allowAccessTo('admin'), deleteUser);
module.exports = router;
