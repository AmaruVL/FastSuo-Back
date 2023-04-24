"use strict";
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database')

const crearModel = (sequelize, DataTypes) => {
  const operacion_cuenta = sequelize.define(
    "operacion_cuenta",
    {
      documento_codigo: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.STRING(4),
        references: {
          model: "operacion_caja",
          key: "documento_codigo"
        }
      },
      documento_serie: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.INTEGER,
        references: {
          model: "operacion_caja",
          key: "documento_serie"
        }
      },
      nro_operacion: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.INTEGER,
        references: {
          model: "operacion_caja",
          key: "nro_operacion"
        }
      },
      recibo_tipo: {
        type: DataTypes.STRING(45)
      },
      codigo_insumo: {
        type: DataTypes.STRING(50)
      },
      razon_social: {
        type: DataTypes.STRING(250)
      },
      importe: {
        type: DataTypes.DECIMAL(10, 3)
      },
      comision: {
        type: DataTypes.DECIMAL(7, 3)
      },
      cuenta_nro_operacion: {
        type: DataTypes.STRING(20)
      },
      moneda: {
        type: DataTypes.INTEGER
      },
      id_cuenta_tercera: {
        type: DataTypes.STRING(20),
        references: {
          model: "cuenta_corriente",
          key: "id_cuenta"
        }
      },
      entidad_codigo: {
        type: DataTypes.STRING(12),
        references: {
          model: "entidad_financiera_servicios",
          key: "entidad_codigo"
        }
      },
      cuenta_codigo: {
        type: DataTypes.STRING(8),
        references: {
          model: "cuenta",
          key: "cuenta_codigo"
        }
      }
    },
    {
      freezeTableName: true
    }
  );

  operacion_cuenta.removeAttribute("id");
  operacion_cuenta.associate = function(models) {
    operacion_cuenta.belongsTo(models.cuenta_corriente, {
      as: "cuenta_corriente",
      foreignKey: "id_cuenta_tercera",
      targetKey: "id_cuenta",
      constraints: false
    });
    operacion_cuenta.belongsTo(models.entidad_financiera_servicios, {
      as: "entidad_financiera",
      foreignKey: "entidad_codigo",
      targetKey: "entidad_codigo",
      constraints: false
    });
    operacion_cuenta.belongsTo(models.cuenta, {
      as: "cuenta",
      foreignKey: "cuenta_codigo",
      targetKey: "cuenta_codigo",
      constraints: false
    });
  };
  return operacion_cuenta;
};

module.exports = crearModel(sequelize, DataTypes)