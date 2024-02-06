require('dotenv').config();

const mongoose = require('mongoose');

const app = require('./app');

const syncDataWithDb = require('./dev-data/import-dev-data');

const db = process.env.DB_URL.replace('PASSWORD', process.env.DB_PASS).replace(
  'USER',
  process.env.DB_USER,
);
mongoose.connect(db);

const PORT = 4000;
app.listen(PORT, () => {
  syncDataWithDb();
});
