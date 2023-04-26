"use strict";
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database')

const crearModel = (sequelize, DataTypes) => {
  const cuenta = sequelize.define(
    "cuenta",
    {
      cuenta_codigo: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.STRING(8)
      },
      cuenta_denominacion: {
        type: DataTypes.STRING(120),
        validate: {
          is: {
            args: /^[a-z\d\-_\s]+$/i, //valida texto alfanumerico con espacios
            msg: "Campo debe contener solo letras y numeros"
          }
        }
      },
      cuenta_tipo: {
        type: DataTypes.STRING(12),
        validate: {
          is: { args: /^[a-z]+|[A-Z]+| |$/i, msg: "Campo debe contener solo letras y numeros" }
        }
      },
      codigo_sunat: {
        type: DataTypes.INTEGER,
        validate: {
          isInt: {
            //valida que sea numero entero
            args: true,
            msg: "Campo debe contener solo numeros"
          }
        }
      },
      cuenta_obs: {
        type: DataTypes.STRING(120),
        validate: {
          is: { args: /^[a-z]+|[A-Z]+| |$/i, msg: "Campo debe contener solo letras y numeros" }
        }
      },
      estado_registro: {
        type: DataTypes.BOOLEAN
      }
    },
    {
      freezeTableName: true
    }
  );

  cuenta.removeAttribute("id");
  cuenta.associate = function(models) {
    // associations can be defined here
    cuenta.hasMany(models.operacion_caja, {
      foreignKey: "cuenta_codigo",
      sourceKey: "cuenta_codigo",
      constraints: false
    });
    cuenta.hasMany(models.recibo_interno, {
      foreignKey: "cuenta_codigo",
      sourceKey: "cuenta_codigo",
      constraints: false
    });
  };
  return cuenta;
};

module.exports = crearModel(sequelize, DataTypes)