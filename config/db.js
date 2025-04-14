const { Sequelize } = require('sequelize');
const sqlite3 = require('sqlite3');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'sequelize.sqlite',
  dialectModule: sqlite3,
});

module.exports = sequelize;
