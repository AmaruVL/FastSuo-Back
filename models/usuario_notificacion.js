"use strict";
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database')

const crearModel = (sequelize, DataTypes) => {
  const usuario_notificacion = sequelize.define(
    "usuario_notificacion",
    {
      id_usuario: {
        type: DataTypes.STRING(20),
        allowNull: false,
        reference: {
          model: "cuenta_usuario",
          key: "usuario"
        }
      },
      id_notificacion: {
        type: DataTypes.INTEGER,
        allowNull: false,
        reference: {
          model: "notificaciones",
          key: "id"
        }
      },
      leido: {
        type: DataTypes.BOOLEAN
      }
    },
    {
      freezeTableName: true
    }
  );

  usuario_notificacion.associate = function(models) {};
  return usuario_notificacion;
};

module.exports = crearModel(sequelize, DataTypes)