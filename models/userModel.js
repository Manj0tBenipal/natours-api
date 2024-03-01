const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is a required field'],
  },
  email: {
    type: String,
    required: [true, 'Email is a required field'],
    unique: true,
    lowerCase: true,
    validate: {
      validator: function (value) {
        return validator.isEmail(value);
      },
      message: 'Invalid Email Address.',
    },
  },
  photo: {
    type: String,
  },
  password: {
    type: String,
    requried: [true, 'Password is mandatory'],
    minLength: [12, 'password should be minimum 12 characters long'],
    maxLength: [20, 'password can be maximun 20 character long'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    requried: [true, 'Password is mandatory'],
    minLength: [12, 'password should be minimum 12 characters long'],
    maxLength: [20, 'password can be maximun 20 character long'],
    validate: {
      validator: function (value) {
        return this.password === value;
      },
      message: 'The passwords do not match',
    },
  },
  lastPasswordChange: {
    type: Date,
  },
  passwordResetToken: {
    type: String,
    select: false,
  },
  passwordResetTokenExpire: {
    type: Date,
    select: false,
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'admin', 'guide', 'lead-guide'],
      message: 'Role can be either customer or admin',
    },
    select: false,
    default: 'customer',
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

/**
 * This query middleware  adds {active: true} to the find Object of every query
 * involving a find operation
 * it executes before any other find query is executed
 */
userSchema.pre(/^find/, function (next) {
  /**
   * in some cases we want the find queries to include users that are
   * not active for example in case the user wants to activate their account
   * and in that case the app needs to find user using their email and change active: true
   *
   * In case the app needs to include inactive users in the result
   * the object inside the find query can be passed includeInactive: true
   * and in this middleware we can filter results based on the value of
   * includeInactive and then delete this field from the query as it is
   * not present in the User schema
   */

  const { includeInactive } = this._conditions;

  //Only executed when includeInactive is false or undefined
  if (!includeInactive) {
    this.find({ active: true });
  }
  //delete includeInactive if it was one of the conditions
  if (includeInactive !== undefined) delete this._conditions.includeInactive;
  next();
});

/**
 * NOTE: below are two middlewares performing the same operation which is saving/updating password
 * But only one middleware is executed at a given time.
 * 1. 'save': when a new document is created/updated using doc.save()
 * 2. 'findOneAndUpdate': when an existing document is updated using findOneAndUpdate
 */
/**
 * 1. This function generates an encrypted password when a new user is signed up
 * or the password of an existing user is changed using doc.save()
 *  Password hash is generated before saving the field to the database
 * 2.Also, the  function changes the lastPasswordChange field in a User document
 * to the current time when a user was registered for the first time
 */
userSchema.pre('save', async function (next) {
  /**
   * The function will exit if
   * the document being is being updated but the password is not.
   */
  if (!this.isNew && !this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 10);
  this.lastPasswordChange = Date.now();
  this.passwordConfirm = undefined;
  next();
});

/**
 * 1. This function changes the encrypted password in the database whenever user updates their passoword
 * Also at the same time :
 * this function modifies the lastPasswordChange field for a document
 */
userSchema.pre('findOneAndUpdate', async function (next) {
  //exit the function if password is not being updated
  if (!this.get('password')) return next();
  /**
   * 1. find the doc by id
   * 2. change the lastPasswordChange to currentTime
   * 3. Move to the next Middleware
   */
  try {
    const encryptedPassword = await bcrypt.hash(this.get('password'), 10);

    this._update.$set.password = encryptedPassword;
    this._update.$set.lastPasswordChange = Date.now();
    next();
  } catch (err) {
    next(err);
  }
});
/**
 * Instance method used to compare passowrd while logging in
 * In case of an error, it will be caught in the /login route handler
 * and an appropriate response will be sent
 * @param {String} candidatePassword password sent by user in the request
 * @param {String} encryptedPassword encrypted password stored in database
 * @returns
 */
userSchema.methods.passwordMatch = async function (
  candidatePassword,
  encryptedPassword,
) {
  return await bcrypt.compare(candidatePassword, encryptedPassword);
};

/**
 * This function accepts a timestamp in milliseconds and compares it with
 * lastPassowordChange field of the document and returns a boolean:
 * 1. true if password was changed after the input timeStamp
 * 2. false if lastPasswordChange is less than input timeStamp
 * @param {Number} timestamp
 * @returns {Boolean}
 */
userSchema.methods.passwordChangedAfter = function (timeStamp) {
  const passChangeInSec = parseInt(
    this.lastPasswordChange.getTime() / 1000,
    10,
  );
  return passChangeInSec > timeStamp;
};

/**
 * This function creates a random 36 characters string which serves the purpose of authentication
 * when a user resets their password.
 * The database stores a hashed version of this string as passwordResetToken
 * The token has expiry of 10 mins from the time of its creation which is stored as
 * passwordResetTokenExpire
 * @returns {String} a random String which is used as a authentication token while resetting password
 */
userSchema.methods.createPasswordResetToken = function () {
  //Generate a random UUID then store the hashed version as passwordResetToken
  const token = crypto.randomUUID();
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  //Set the expiry of reset token to currentDate + 10mins
  this.passwordResetTokenExpire = Date.now() + 10 * 60 * 1000;
  return token;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
