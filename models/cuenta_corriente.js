"use strict";
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database')

const crearModel = (sequelize, DataTypes) => {
  const cuenta_corriente = sequelize.define(
    "cuenta_corriente",
    {
      id_cuenta: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.STRING(20)
      },
      entidad_codigo: {
        type: DataTypes.STRING(12),
        references: {
          model: "entidad_financiera_servicios",
          key: "entidad_codigo"
        }
      },
      id_cliente: {
        type: DataTypes.STRING(12),
        references: {
          model: "cliente_proveedor",
          key: "id_cliente"
        }
      },
      tipo_cta: {
        type: DataTypes.STRING(45)
      },
      tipo_cta_bancaria: {
        type: DataTypes.STRING(45)
      },
      tasa_interes_mensual: {
        type: DataTypes.DECIMAL(6, 3)
      },
      cta_observacion: {
        type: DataTypes.STRING(250)
      },
      estado_registro: {
        type: DataTypes.BOOLEAN
      },
      oficina_codigo_src: {
        type: DataTypes.STRING(12),
        references: {
          model: "oficina",
          key: "oficina_codigo"
        }
      },
      es_servicio: {
        type: DataTypes.BOOLEAN
      },
      credito_maximo_soles: {
        type: DataTypes.DECIMAL(8, 2),
        defaultValue: 0
      },
      credito_maximo_dolares: {
        type: DataTypes.DECIMAL(8, 2),
        defaultValue: 0
      },
      credito_maximo_otros: {
        type: DataTypes.DECIMAL(8, 2),
        defaultValue: 0
      }
    },
    {
      freezeTableName: true
    }
  );

  cuenta_corriente.removeAttribute("id");
  cuenta_corriente.associate = function(models) {
    cuenta_corriente.belongsTo(models.entidad_financiera_servicios, {
      as: "entidad_financiera",
      foreignKey: "entidad_codigo",
      targetKey: "entidad_codigo",
      constraints: false
    });
    cuenta_corriente.belongsTo(models.cliente_proveedor, {
      as: "cliente",
      foreignKey: "id_cliente",
      targetKey: "id_cliente",
      constraints: false
    });
    cuenta_corriente.belongsTo(models.oficina, {
      as: "oficina",
      foreignKey: "oficina_codigo_src",
      targetKey: "oficina_codigo",
      constraints: false
    });
  };
  return cuenta_corriente;
};

module.exports = crearModel(sequelize, DataTypes)