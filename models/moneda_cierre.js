"use strict";
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database')

const crearModel = (sequelize, DataTypes) => {
  const moneda_cierre = sequelize.define(
    "moneda_cierre",
    {
      id: {
        primaryKey: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        reference: {
          model: "moneda_denominacion",
          key: "id"
        }
      },
      fecha_trabajo: {
        primaryKey: true,
        type: DataTypes.DATEONLY,
        allowNull: false,
        reference: {
          model: "caja_trabajo",
          key: "fecha_trabajo"
        }
      },
      caja_codigo: {
        primaryKey: true,
        type: DataTypes.STRING(7),
        allowNull: false,
        reference: {
          model: "caja_trabajo",
          key: "caja_codigo"
        }
      },
      cantidad: {
        type: DataTypes.INTEGER,
        validate: {
          isNumeric: true
        }
      }
    },
    {
      freezeTableName: true
    }
  );

  moneda_cierre.associate = function(models) {
    // associations can be defined here
  };
  return moneda_cierre;
};

module.exports = crearModel(sequelize, DataTypes)