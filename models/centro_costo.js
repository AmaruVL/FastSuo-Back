"use strict";
module.exports = (sequelize, DataTypes) => {
  const centro_costo = sequelize.define(
    "centro_costo",
    {
      centro_costo_id: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.STRING(12)
      },
      centro_costo_nombre: {
        type: DataTypes.STRING(35),
        validate: {
          is: {
            args: /^[a-z\d\-_\s]+$/i, //valida texto alfanumerico con espacios
            msg: "Campo debe contener solo letras y numeros"
          }
        }
      },
      oficina_codigo: {
        type: DataTypes.STRING(12),
        references: {
          model: "oficina",
          key: "oficina_codigo"
        }
      },
      centro_costo_obs: {
        type: DataTypes.STRING(120)
      },
      estado_registro: {
        type: DataTypes.BOOLEAN
      }
    },
    {
      freezeTableName: true
    }
  );

  centro_costo.removeAttribute("id");
  centro_costo.associate = function(models) {
    // associations can be defined here
    centro_costo.belongsTo(models.oficina, {
      foreignKey: "oficina_codigo",
      constraints: false
    });
    centro_costo.hasMany(models.recibo_interno, {
      foreignKey: "centro_costo_id",
      sourceKey: "centro_costo_id"
    });
  };
  return centro_costo;
};
