"use strict";
module.exports = (sequelize, DataTypes) => {
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
