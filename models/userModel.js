const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');

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
});

/**
 * This function generates an encrypted password when a new user is signed up
 * Password hash is generated before saving the field to the database
 */
userSchema.pre('save', async function (next) {
  //exits the function if user is updating the document
  if (!this.isNew) return next();
  this.password = await bcrypt.hash(this.password, 10);
  this.passwordConfirm = undefined;
  next();
});
/**
 * This function changes the lastPasswordChange field in a User document
 * to the current time when a user was registered for the first time
 */
userSchema.pre('save', function (next) {
  //exits the function if user is updating the document
  if (!this.isNew) return next();
  this.lastPasswordChange = Date.now();
  next();
});

/**
 * This function modifies the lastPasswordChange field for a document
 * The field is updated when a password is changed for an existing user
 */
userSchema.pre('findOneAndUpdate', async function (next) {
  //exit the function if password is not being updated
  if (!this.get('password')) return next();
  /**
   * 1. find the doc by id
   * 2. change the lastPasswordChange to currentTime
   * 3. Move to the next Middleware
   */
  const doc = await this.model.findById(this._conditions._id);
  doc.lastPasswordChange = Date.now();
  await doc.save();
  next();
});
/**
 * /**
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

const User = mongoose.model('User', userSchema);
module.exports = User;
