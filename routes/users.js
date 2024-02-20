const express = require('express');
const {
  signup,
  login,
  isLoggedIn,
  allowAccessTo,
} = require('../controllers/auth');
const { getAllUsers, updateUser, deleteUser } = require('../controllers/users');
const { modifyQueryToFilterObjSyntax } = require('../utils/functions');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.route('/').get(isLoggedIn, modifyQueryToFilterObjSyntax, getAllUsers);

//This Update route for now does not ask user for their previous credentials
//It is being developed temporarily to test if  pre-save hooks change lastPasswordChange in database
//Future enhancement to the delete route will include checking the roles of the users before giving access to the route
router
  .route('/:id')
  .patch(updateUser)
  .delete(isLoggedIn, allowAccessTo('admin', 'lead-guide'), deleteUser);
module.exports = router;
