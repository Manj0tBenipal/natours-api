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
    reference: 'User',
  },
  tourId: {
    type: mongoose.Schema.ObjectId,
    reference: 'Tour',
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: [true, 'Rating is required'],
  },
  createdAt: Date,
});

reviewSchema.pre('save', function (next) {
  if (!this.isNew) return next();
  this.createdAt = Date.now();
  next();
});
const Review = mongoose.model(reviewSchema);
module.exports = Review;
