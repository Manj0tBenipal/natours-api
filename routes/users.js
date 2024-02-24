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
  updateUser,
  deleteUser,
  updateMe,
  deactivateAccount,
} = require('../controllers/users');
const { modifyQueryToFilterObjSyntax } = require('../utils/functions');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/change-password', isLoggedIn, changePassword);
router.post('/deactivate-account', isLoggedIn, deactivateAccount);
router
  .route('/')
  .get(isLoggedIn, modifyQueryToFilterObjSyntax, getAllUsers)
  .patch(isLoggedIn, updateMe);

//Routes to update and delete User documents but are only accessible by admin
router
  .route('/:id')
  .patch(isLoggedIn, allowAccessTo('admin'), updateUser)
  .delete(isLoggedIn, allowAccessTo('admin'), deleteUser);
module.exports = router;
