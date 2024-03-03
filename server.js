require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const db = process.env.DB_URL.replace('PASSWORD', process.env.DB_PASS).replace(
  'USER',
  process.env.DB_USER,
);
mongoose
  .connect(db)
  .then(() => {
    console.log('dbConnected');
  })
  .catch((err) => {
    console.log(err);
  });
app.listen(process.env.PORT);
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  process.exit(1);
});
