const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

if (process.env.NODE_ENV === 'test') {
  // Utiliser SQLite en mémoire pour les tests
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
  });
} else {
  // Utiliser PostgreSQL en développement ou production
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL manquant dans le fichier .env');
  }

  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    logging: false,
  });
}

module.exports = sequelize;
