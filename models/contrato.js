"use strict";
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database')

const crearModel = (sequelize, DataTypes) => {
  const contrato = sequelize.define(
    "contrato",
    {
      nro_contrato: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      oficina_codigo: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.STRING(12),
        references: {
          model: "oficina",
          key: "oficina_codigo"
        }
      },
      contrato_fecha_inicio: {
        type: DataTypes.DATEONLY,
        validate: {
          isDate: true
        }
      },
      contrato_fecha_fin: {
        type: DataTypes.DATEONLY,
        validate: {
          isDate: true
        }
      },
      credito_maximo: {
        type: DataTypes.DECIMAL(8, 2),
        validate: {
          isNumeric: true,
          min: 0
        }
      },
      dt_directo: {
        type: DataTypes.DECIMAL(8, 3),
        validate: {
          isNumeric: true,
          min: 0
        }
      },
      dt_afiliado: {
        type: DataTypes.DECIMAL(8, 3),
        validate: {
          isNumeric: true,
          min: 0
        }
      },
      dt_tercero: {
        type: DataTypes.DECIMAL(8, 3),
        validate: {
          isNumeric: true,
          min: 0
        }
      },
      monto_alerta: {
        type: DataTypes.DECIMAL(8, 3),
        validate: {
          isNumeric: true,
          min: 0
        }
      },
      contrato_estado: {
        type: DataTypes.STRING(12),
        validate: {
          is: {
            args: /^[a-z\d\-_\s]+$/i, //valida texto alfanumerico con espacios
            msg: "Campo debe contener solo letras y numeros"
          }
        }
      }
    },
    {
      freezeTableName: true
    }
  );

  contrato.removeAttribute("id");
  contrato.associate = function(models) {
    // associations can be defined here
    contrato.belongsTo(models.oficina, {
      foreignKey: "oficina_codigo",
      constraints: false
    });
  };
  return contrato;
};

module.exports = crearModel(sequelize, DataTypes)