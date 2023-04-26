"use strict";
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database')

const crearModel = (sequelize, DataTypes) => {
  const entidad_financiera_servicios = sequelize.define(
    "entidad_financiera_servicios",
    {
      entidad_codigo: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.STRING(12)
      },
      entidad_razon_social: {
        type: DataTypes.STRING(35),
        validate: {
          is: {
            args: /^[a-z\d\-_\.ñÑáéíóúÁÉÍÓÚ\s]+|$/i, //valida texto alfanumerico con espacios
            msg: "Campo debe contener solo letras y numeros"
          }
        }
      },
      entidad_tipo: {
        type: DataTypes.STRING(12),
        validate: {
          is: {
            args: /^[a-z\d\-_\.ñÑáéíóúÁÉÍÓÚ\s]+|$/i, //valida texto alfanumerico con espacios
            msg: "Campo debe contener solo letras y numeros"
          }
        }
      },
      cuenta_codigo: {
        type: DataTypes.STRING(8),
        references: {
          model: "cuenta",
          key: "cuenta_codigo"
        }
      },
      comision: {
        type: DataTypes.BOOLEAN
      }
    },
    {
      freezeTableName: true
    }
  );

  entidad_financiera_servicios.removeAttribute("id");
  entidad_financiera_servicios.associate = function(models) {
    // associations can be defined here
    entidad_financiera_servicios.hasMany(models.transferencia, {
      foreignKey: "deposito_entidad_codigo",
      sourceKey: "entidad_codigo"
    });
  };
  return entidad_financiera_servicios;
};

module.exports = crearModel(sequelize, DataTypes)