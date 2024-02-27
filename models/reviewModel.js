const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  text: {
    type: String,
    maxLength: 300,
    minLength: 20,
  },
  likes: Number,
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Review must belong to a user'],
  },
  tourId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'Review must belong to a tour'],
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: [true, 'Rating is required'],
  },
  createdAt: Date,
});

//removed unused fields from the query selection
reviewSchema.pre(/^find/, function (next) {
  this.select('-__v');
  next();
});
/**
 * Assigns value to createdAt field in Review,
 * Even if user provides this field in order to manipulate createdAt manually
 * it will be overriden by this pre-save hook
 */
reviewSchema.pre('save', function (next) {
  if (!this.isNew) return next();
  this.createdAt = Date.now();
  next();
});
const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
