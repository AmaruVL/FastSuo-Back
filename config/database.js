const Sequelize = require('sequelize')
const env = process.env.NODE_ENV || "development";
let config = require(__dirname + "./../config/config")[env];

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable]);
} else {
  // sequelize = new Sequelize(config.database, config.username, config.password, config); //Warning
  sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: config.dialect
  })
}

module.exports = sequelize
