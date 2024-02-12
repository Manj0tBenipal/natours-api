const mongoose = require(`mongoose`);
// const slugify = require('slugify');

const toursSchema = new mongoose.Schema(
  {
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
    slug: String,
    startDates: [Date],
    secretTour: Boolean,
  },
  //Schema options to include virtual properties in the result
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
/**
 * Excludes the tours that have  been marked as secret
 * A query middleware using a regex to execute on any query that use the word find
 */
toursSchema.pre(/^find/, function () {
  this.start = Date.now();
  this.find({ secretTour: { $ne: true } });
});
/**
 * Excludes the tours that have  been marked as secret
 * A query middleware using a regex to execute on any query that use the word find
 */
toursSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} ms`);
  next();
});
//Virtual Property calculated on the fly
toursSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});
/**
 * Aggregation middleware
 * the aggregation pipeline if used will still process the documents containing the field secretTour=true
 * To prevent that we need to use aggregation middleware which will be executed before every aggregation pipeline
 * The this is the aggregation object which is used in the aggregation pipeline
 */
toursSchema.pre('aggregate', function (next) {
  this._pipeline.unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

// //Document middleware: runs before .save and .create()
// toursSchema.pre('save', function (next) {
//   //the 'this' keyword inside of a document middleware's body
//   //refers to the current document being processed
//   this.slug = `${slugify(this.name, { lower: true })}-${crypto.randomUUID()}`;
//   next();
// });

// toursSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

const Tour = mongoose.model('Tour', toursSchema);
module.exports = Tour;
