"use strict";
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const basename = path.basename(__filename);
const sequelize = require("../config/database");
const db = {};

sequelize
  .authenticate()
  .then(() => {
    console.log("Conectado a la base de datos.");
  })
  .catch(err => {
    console.error("No se pudo conectar a la base de datos", err);
  });

fs.readdirSync(__dirname)
  .filter(file => {
    return file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js";
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file));
    const modelName = file.slice(0, -3);
    db[modelName] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.sequelize
  .sync({
    alter: true,
    logging: false,
  })
  .then(() => {
    console.log("Base de datos sincronizada");
  });

module.exports = db;
