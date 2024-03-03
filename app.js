const express = require('express');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const tourRouter = require(`${__dirname}/routes/tours.js`);
const reviewRouter = require(`${__dirname}/routes/review.js`);
const userRouter = require(`${__dirname}/routes/users.js`);

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request!',
});
const app = express();
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use('/api', limiter);
app.use(mongoSanitize());
app.use(xss());
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
    ],
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use('/api/v1/users', userRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/reviews', reviewRouter);
app.all('*', (req, res) => {
  res.status(404).json({
    status: 'failed',
    err: 'This tour does not exist',
  });
});
app.use((err, req, res, next) => {
  let { statusCode, message } = err;
  if (!statusCode) statusCode = 500;
  if (!message) message = 'An unknown error has occured';
  res.status(statusCode).json({
    status: 'fail',
    message: message,
  });
});
module.exports = app;
