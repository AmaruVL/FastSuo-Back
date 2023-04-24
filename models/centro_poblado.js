"use strict";
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database')

const crearModel = (sequelize, DataTypes) => {
  const centro_poblado = sequelize.define(
    "centro_poblado",
    {
      id_centro_poblado: {
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER
      },
      nombre_centro_poblado: {
        type: DataTypes.STRING(255)
      },
      ubicacion: {
        type: DataTypes.STRING(500)
      },
      extension: {
        type: DataTypes.STRING(255)
      }
    },
    {
      freezeTableName: true
    }
  );

  centro_poblado.removeAttribute("id");
  centro_poblado.associate = function(models) {
    // associations can be defined here
    centro_poblado.hasMany(models.oficina, {
      foreignKey: "id_centro_poblado",
      constraints: false
    });
    centro_poblado.hasMany(models.transferencia, {
      foreignKey: "id_centro_poblado_destino",
      constraints: false
    });
  };
  return centro_poblado;
};

module.exports = crearModel(sequelize, DataTypes)