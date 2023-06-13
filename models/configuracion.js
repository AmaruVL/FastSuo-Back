const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const configuracion = sequelize.define(
  'configuracion',
  {
    clave: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.STRING(50),
    },
    valor: {
      allowNull: false,
      type: DataTypes.STRING(200),
    },
  },
  {
    freezeTableName: true,
  },
);

configuracion.associate = function (models) {
  //  associations can be defined here
};

module.exports = configuracion;
