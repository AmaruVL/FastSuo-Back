const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('./config');

const paramsDB = config[env];
let sequelize;

if (env === 'development' || env === 'production') {
  //  Establecer conexion con BD
  const logging = paramsDB.logging !== 'false' ? console.log : false;
  sequelize = new Sequelize(paramsDB.database, paramsDB.username, paramsDB.password, {
    host: paramsDB.host,
    dialect: paramsDB.dialect,
    logging,
  });
} else {
  sequelize = new Sequelize(paramsDB);
}

module.exports = sequelize;
