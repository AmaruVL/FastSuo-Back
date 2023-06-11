const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const vehiculo = sequelize.define("vehiculo", {
  id_vehiculo: {
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.INTEGER,
  },
  placa: {
    allowNull: false,
    type: DataTypes.STRING(10),
  },
  marca: {
    type: DataTypes.STRING(10),
  },
  clase: {
    type: DataTypes.STRING(10),
  },
  modelo: {
    type: DataTypes.STRING(10),
  },
  color: {
    type: DataTypes.STRING(10),
  },
});

module.exports = vehiculo;
