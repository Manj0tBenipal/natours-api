const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema({
  text: {
    type: String,
    maxLength: 300,
    minLength: 20,
  },
  likes: Number,
  user: {
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
  this.populate({ path: 'user' });
  next();
});

/**
 * Assigns value to createdAt field in Review,
 * Even if user provides this field in order to manipulate createdAt manually
 * it will be overridden by this pre-save hook
 */
reviewSchema.pre('save', function (next) {
  if (!this.isNew) return next();
  this.createdAt = Date.now();
  next();
});

/**
 * This function uses the tourId and calculated the ratingsAverage and ratingsQuantity
 * of a tour using its reviews.
 * @param tour id of a document of Tour collection
 */
reviewSchema.statics.calcRatingsAverage = async function (tour) {
  const stats = await this.aggregate([
    {
      $match: { tourId: tour },
    },
    {
      $group: {
        _id: '$tourId',
        totalRatings: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  await Tour.findByIdAndUpdate(tour, {
    ratingsAverage: stats[0].avgRating,
    ratingsQuantity: stats[0].totalRatings,
  });
};
/**
 * When a new review is saved this post-save hook calls
 * static function of Review Model to calculate new values of ratingsAverage, ratingsQuantity
 * and saves it to the tour document
 */
reviewSchema.post('save', function () {
  this.constructor.calcRatingsAverage(this.tourId);
});

/**
 * When an existing review is updated or deleted using findOneAndUpdate/findOneAndDelete this post-save hook calls
 * static function of Review Model to calculate new values of ratingsAverage, ratingsQuantity
 * and saves it to the tour document
 */
reviewSchema.post(/^findOneAnd/, async function (doc) {
  try {
    this.model.calcRatingsAverage(doc.tourId);
  } catch (err) {
    console.log(err);
  }
});

/**
 * When an existing review is deleted this post-save hook calls
 * static function of Review Model to calculate new values of ratingsAverage, ratingsQuantity
 * and saves it to the tour document
 */
reviewSchema.post('deleteOne', async function (doc) {
  try {
    this.model.calcRatingsAverage(doc.tourId);
  } catch (err) {
    console.log('ERR:', err);
  }
});
const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
