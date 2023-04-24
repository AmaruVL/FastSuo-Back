"use strict";
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database')

const crearModel = (sequelize, DataTypes) => {
  const documento = sequelize.define('documento', {
    documento_codigo: {
      primaryKey: true,
      allowNull: false,
      type: DataTypes.STRING(4)
    },
    documento_descripcion: {
      type: DataTypes.STRING(35),
      validate: {
        is: {
          args: /^[a-z\d\-_\.ñÑáéíóúÁÉÍÓÚ\s]+|$/i, //valida texto alfanumerico con espacios
          msg: "Campo debe contener solo letras y numeros"
        }
      }
    },
    tipo_documento: {
      type: DataTypes.STRING(12),
      validate: {
        is: {
          args: /^[a-z\d\-_\.ñÑáéíóúÁÉÍÓÚ\s]+|$/i, //valida texto alfanumerico con espacios
          msg: "Campo debe contener solo letras y numeros"
        }
      }
    },
    codigo_sunat: {
      type: DataTypes.STRING(4),
      validate: {
        is: {
          args: /^[a-z\d\-_\.ñÑáéíóúÁÉÍÓÚ\s]+|$/i, //valida texto alfanumerico con espacios
          msg: "Campo debe contener solo letras y numeros"
        }
      }
    },
    estado_registro: {
      type: DataTypes.BOOLEAN
    },
  }, {

    freezeTableName: true
  });

  documento.removeAttribute('id');
  documento.associate = function (models) {
    // associations can be defined here
  };
  return documento;
};

module.exports = crearModel(sequelize, DataTypes)