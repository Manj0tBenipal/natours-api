const mongoose = require(`mongoose`);
const toursSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'name must be a valid string'],
    unique: true,
  },
  price: {
    type: Number,
    required: [true, 'price must be included'],
  },
  rating: {
    type: Number,
    default: 4.5,
  },
  duration: {
    type: Number,
    required: [true, 'Providing Duration is  mandatory '],
  },
  difficulty: {
    type: String,
    required: [true, 'Providing difficulty is necessary'],
  },
  reatingsQuantity: {
    type: Number,
    default: 0,
  },
  ratingsAverage: {
    type: Number,
    default: 0,
  },
  priceDiscount: Number,
  summary: {
    type: String,
    required: [true, 'Summary is a mandatroty field'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  imageCover: {
    type: String,
    required: [true, 'Cover Image is a required Field'],
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  startDates: [Date],
});
const Tour = mongoose.model('Tour', toursSchema);
module.exports = Tour;
