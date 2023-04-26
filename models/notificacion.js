"use strict";
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database')

const crearModel = (sequelize, DataTypes) => {
  const notificacion = sequelize.define(
    "notificacion",
    {
      id: {
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER
      },
      fecha_registro: {
        type: DataTypes.DATE,
        validate: {
          isDate: true
        }
      },
      texto1: {
        type: DataTypes.TEXT
      },
      texto2: {
        type: DataTypes.TEXT
      },
      texto3: {
        type: DataTypes.TEXT
      },
      usuario_registro: {
        type: DataTypes.STRING(20),
        references: {
          model: "cuenta_usuario",
          key: "usuario"
        }
      },
      tipo: {
        type: DataTypes.STRING(250)
      },
      grupo: {
        type: DataTypes.STRING(250)
      }
    },
    {
      freezeTableName: true
    }
  );

  notificacion.associate = function(models) {
    // associations can be defined here
    notificacion.belongsToMany(models.cuenta_usuario, {
      through: models.usuario_notificacion,
      as: "ListaNotificacion",
      foreignKey: "id_usuario",
      otherKey: "id_notificacion"
    });
  };
  return notificacion;
};

module.exports = crearModel(sequelize, DataTypes)