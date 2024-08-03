const Datastore = require('nedb');
const path = require('path');

const db = new Datastore({
    filename: path.join(__dirname, '../data/opportunities.db'),
    autoload: true
});

module.exports = db;