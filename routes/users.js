const express = require('express');
const { signup, login, isLoggedIn } = require('../controllers/auth');
const { getAllUsers, updateUser } = require('../controllers/users');
const { modifyQueryToFilterObjSyntax } = require('../utils/functions');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.route('/').get(isLoggedIn, modifyQueryToFilterObjSyntax, getAllUsers);

//This route for now does not ask user for their previous credentials
//It is being developed temporarily to test if  pre-save hooks change lastPasswordChange in database
router.route('/:id').patch(updateUser);
module.exports = router;
