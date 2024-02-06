const express = require('express');

const router = express.Router();
const getUsers = (req, res) => {
  res.status(404).json({ status: 'failed', message: 'Item not found' });
};
const getUserById = (req, res) => {
  res.status(404).json({ status: 'failed', message: 'Item not found' });
};
const addUser = (req, res) => {
  res.status(404).json({ status: 'failed', message: 'Item not found' });
};
const updateUser = (req, res) => {
  res.status(404).json({ status: 'failed', message: 'Item not found' });
};
const deleteUser = (req, res) => {
  res.status(404).json({ status: 'failed', message: 'Item not found' });
};
router.route('/').get(getUsers).post(addUser);
router.route('/:id').get(getUserById).patch(updateUser).delete(deleteUser);
module.exports = router;
