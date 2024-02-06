require('dotenv').config();

const fs = require('fs');

const mongoose = require('mongoose');

const Tour = require('../models/tourModel');

const db = process.env.DB_URL.replace('PASSWORD', process.env.DB_PASS).replace(
  'USER',
  process.env.DB_USER,
);
mongoose.connect(db);

const data = JSON.parse(
  fs.readFileSync('./dev-data/data/tours-simple.json', 'utf-8'),
);
const syncDataWithDb = async () => {
  try {
    await Tour.deleteMany();
    await Tour.create(data);
  } catch (err) {
    console.log(err);
  }
};
module.exports = syncDataWithDb;
