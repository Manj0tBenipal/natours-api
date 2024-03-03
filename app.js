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
const errorHandler = require('./controllers/error');

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

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message:
      'Welcome to natours-api 🎉. Please check the documentation at:https://documenter.getpostman.com/view/32620000/2sA2xb6vto#ca5ab2ae-773f-4346-8e30-0ac79b9ecdbf',
  });
});
app.all('*', (req, res) => {
  res.status(404).json({
    status: 'failed',
    err: 'This tour does not exist',
  });
});
app.use(errorHandler);
module.exports = app;
