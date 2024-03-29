const express = require('express');
const {
  signup,
  login,
  isLoggedIn,
  allowAccessTo,
  forgotPassword,
  resetPassword,
  changePassword,
  authUsingCookie,
} = require('../controllers/auth');
const {
  getAllUsers,
  updateUser,
  deleteUser,
  updateMe,
  deactivateAccount,
  activateAccount,
  addUserIdToParams,
  getMe,
  getUserById,
} = require('../controllers/users');
const { modifyQueryToFilterObjSyntax } = require('../utils/functions');

const router = express.Router();

//This route is used to verify user's auth status on every request made to the server
router.get('/auth-using-cookie', isLoggedIn, authUsingCookie);
router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/change-password', isLoggedIn, changePassword);
router.post('/activate-account', activateAccount);
router.post('/deactivate-account', isLoggedIn, deactivateAccount);
router
  .route('/')
  .get(isLoggedIn, modifyQueryToFilterObjSyntax, getAllUsers)
  .patch(isLoggedIn, updateMe);

router.use(isLoggedIn, allowAccessTo('admin'));

//Routes to update and delete User documents but are only accessible by admin
router.route('/:id').get(getUserById).patch(updateUser).delete(deleteUser);
router.get('/me', addUserIdToParams, getMe);
module.exports = router;
