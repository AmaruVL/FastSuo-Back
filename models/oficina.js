"use strict";
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database')

const crearModel = (sequelize, DataTypes) => {
  const oficina = sequelize.define(
    "oficina",
    {
      oficina_codigo: DataTypes.STRING,
      oficina_codigo: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.STRING(12)
      },
      oficina_nombre: {
        type: DataTypes.STRING(20)
      },
      oficina_tipo: {
        type: DataTypes.STRING(10)
      },
      oficina_ubicacion: {
        type: DataTypes.STRING(250)
      },
      oficina_direccion: {
        type: DataTypes.STRING(80)
      },
      oficina_referencia: {
        type: DataTypes.STRING(120)
      },
      oficina_correo: {
        type: DataTypes.STRING(45)
      },
      oficina_encargado: {
        type: DataTypes.STRING(45)
      },
      estado_registro: {
        type: DataTypes.BOOLEAN
      },
      modo_conexion: {
        type: DataTypes.INTEGER,
        defaultValue: 2
      },
      tipo_arreglo: {
        type: DataTypes.STRING(18),
        defaultValue: "REAL"
      },
      empresa_codigo: {
        type: DataTypes.STRING(14),
        references: {
          model: "empresa",
          key: "empresa_codigo"
        }
      }
    },
    {
      freezeTableName: true
    }
  );

  oficina.removeAttribute("id");
  oficina.associate = function(models) {
    // associations can be defined here
    oficina.belongsTo(models.empresa, {
      foreignKey: "empresa_codigo",
      targetKey: "empresa_codigo",
      constraints: false
    });
    oficina.hasMany(models.documento_serie, {
      foreignKey: "oficina_codigo",
      constraints: false
    });
    oficina.hasMany(models.centro_costo, {
      foreignKey: "oficina_codigo",
      constraints: false
    });
    oficina.hasMany(models.caja, {
      foreignKey: "oficina_codigo",
      constraints: false
    });
    oficina.hasMany(models.contrato, {
      foreignKey: "oficina_codigo",
      constraints: false
    });
    oficina.hasMany(models.comision, {
      as: "comisiones",
      foreignKey: "oficina_codigo",
      sourceKey: "oficina_codigo",
      constraints: false
    });
    oficina.hasMany(models.habilitacion, {
      foreignKey: "origen_oficina_codigo",
      sourceKey: "oficina_codigo",
      constraints: false
    });
    oficina.hasMany(models.habilitacion, {
      foreignKey: "destino_oficina_codigo",
      sourceKey: "oficina_codigo",
      constraints: false
    });
  };
  return oficina;
};

module.exports = crearModel(sequelize, DataTypes)