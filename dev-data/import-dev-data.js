require('dotenv').config();

const fs = require('fs');

const mongoose = require('mongoose');

const Tour = require('../models/tourModel');
const Review = require('../models/reviewModel');
const User = require('../models/userModel');

const db = process.env.DB_URL.replace('PASSWORD', process.env.DB_PASS).replace(
  'USER',
  process.env.DB_USER,
);
mongoose.connect(db);

const data = JSON.parse(fs.readFileSync('./dev-data/data/tours.json', 'utf-8'));
const users = JSON.parse(
  fs.readFileSync('./dev-data/data/users.json', 'utf-8'),
);
const reviews = JSON.parse(
  fs.readFileSync('./dev-data/data/reviews.json', 'utf-8'),
);
const syncDataWithDb = async () => {
  try {
    await Tour.deleteMany();
    await Tour.create(data);
    await Review.deleteMany();
    await Review.create(reviews, { validateBeforeSave: false });
    await User.deleteMany();
    await User.create(users, { validateBeforeSave: false });
  } catch (err) {
    console.log(err);
  }
};
module.exports = syncDataWithDb;
