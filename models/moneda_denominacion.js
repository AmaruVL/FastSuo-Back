"use strict";
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database')

const crearModel = (sequelize, DataTypes) => {
  const moneda_denominacion = sequelize.define(
    "moneda_denominacion",
    {
      id: {
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER
      },
      tipo_moneda: {
        allowNull: false,
        type: DataTypes.STRING(18)
      },
      nombre: {
        allowNull: false,
        type: DataTypes.STRING(50)
      },
      valor: {
        type: DataTypes.DECIMAL(6, 2),
        validate: {
          isNumeric: true,
          min: 0
        }
      }
    },
    {
      freezeTableName: true
    }
  );

  moneda_denominacion.associate = function(models) {
    // associations can be defined here
  };
  return moneda_denominacion;
};

module.exports = crearModel(sequelize, DataTypes)