const mongoose = require(`mongoose`);
// const slugify = require('slugify');
const toursSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'name must be a valid string'],
      unique: true,
      //Validator for Strings
      maxLength: [40, 'The name of tour cannot exceed 40 characters'],
      minLength: [10, 'The Name should have atleast 10 characters'],
    },
    price: {
      type: Number,
      required: [true, 'price must be included'],
    },
    rating: {
      type: Number,
      default: 4.5,
      min: 0,
      max: 5,
    },
    duration: {
      type: Number,
      required: [true, 'Providing Duration is  mandatory '],
    },
    difficulty: {
      type: String,
      required: [true, 'Providing difficulty is necessary'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Tour can be easy, medium, or difficult',
      },
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    ratingsAverage: {
      type: Number,
      default: 0,
      min: [0, 'Rating must be more than or equal to 1'],
      max: [5, 'Rating must be less than or eqaul to 5'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (inputValue) {
          try {
            /**
             * 'this' object is the entire document being written when the validator is
             * triggrered in a 'save' or 'create' operation. Therefore the discountPrice and original price
             * can be compared and validated
             */
            if (this.isNew) {
              return this.price >= inputValue;
            }
            /**
             * In case of an update operation the this object refers to the Query itself not the document,
             * therefore the validation is handeled using a pre-save middleware.
             * In this case this validation is passed
             * more details are at: https://mongoosejs.com/docs/middleware.html#notes
             */
            return true;
          } catch (err) {
            return false;
          }
        },
        message:
          'The discounted Price cannot be more than or equal to the original price',
      },
    },
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
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
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
toursSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  next();
});
/**
 * Excludes __v field from all results from find queries
 * When Querying tours, the userIds in guides field are populated
 */
toursSchema.pre(/^find/, function (next) {
  //
  this.select('-__v');
  this.populate({
    path: 'guides',
  });
  next();
});
//Virtual Property calculated on the fly
toursSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

toursSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tourId',
  localField: '_id',
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
toursSchema.pre('findOneAndUpdate', async function (next) {
  const doc = await this.model.findById(this._conditions._id);
  if (!doc) {
    throw new Error('Failed to fetch document while validating');
  }
  /**
   * valid is a boolean value which is changed only when price or priceDiscount are being updated
   * in case where only other properties of the document are being modified, this section passes the validation
   */
  let valid = true;
  let errorField = '';
  const errorMessage =
    'Validation Error. priceDicount cannot be greater than price';
  // ---- VALIDATION FOR PRICE AND PRICEDISCOUNT ON UPDATE OPERATIONS---
  /**
   * the .get(<property name>) is a setter provided my mongoose to access
   * properties of $set object which is in the query
   * In case either price or priceDiscount is being updated the one not being updated will be undefined
   */
  const price = this.get('price');
  const priceDiscount = this.get('priceDiscount');
  /**
   * 1. if price is present in query but not priceDiscount check the doc:
   *    a. if priceDiscount is present compare it with new valiue of price. price> priceDicount for success
   *    b. if priceDicount is not in the document then proceed to a successfull validation
   * 2. if only the priceDiscount is being updated in the query:
   *      a. Compare it with the price in the document. price should always be there as it is a required field
   * 3. if  both priceDiscount and price are being updated check if priceDicount is  smaller or larger than price
   *    a. if smaller then validate
   *    b. if larger then invalidate
   */
  if (price && !priceDiscount) {
    valid = doc.priceDiscount ? doc.priceDiscount < price : true;
    if (!valid) errorField = 'price';
  }
  if (!price && priceDiscount) {
    if (!doc.price) {
      throw new Error(
        'The document in database does not meet the schema requirements. Terminating validation',
      );
    }
    valid = doc.price > priceDiscount;
    if (!valid) errorField = 'priceDiscount';
  }
  if (price && priceDiscount) {
    valid = price > priceDiscount;
    if (!valid) errorField = 'priceDicount';
  }
  if (valid) doc.validate();
  else {
    doc.invalidate(errorField, errorMessage);
    throw new Error(errorMessage);
  }
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
