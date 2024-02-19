const express = require('express');
const { signup, login } = require('../controllers/auth');
const { getAllUsers } = require('../controllers/users');
const { modifyQueryToFilterObjSyntax } = require('../utils/functions');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.route('/').get(modifyQueryToFilterObjSyntax, getAllUsers);
module.exports = router;
