"use strict";
module.exports = (sequelize, DataTypes) => {
  const configuracion = sequelize.define(
    "configuracion", {
      clave: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.STRING(50)
      },
      valor: {
        allowNull: false,
        type: DataTypes.STRING(200)
      }
    }, {
      freezeTableName: true
    }
  );

  configuracion.associate = function (models) {
    // associations can be defined here

  };
  return configuracion;
};