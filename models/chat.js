const Datastore = require('nedb');
const path = require('path');

const dbChat = new Datastore({ filename: path.join(__dirname, '../data/chat.db'), autoload: true });

module.exports = dbChat;
