const Datastore = require('nedb');
const path = require('path');

const dbProducts = new Datastore({
  filename: path.join(__dirname, '../data/products.db'),
  autoload: true,
});

module.exports = dbProducts;
