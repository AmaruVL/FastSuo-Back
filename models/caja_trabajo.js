"use strict";
module.exports = (sequelize, DataTypes) => {
  const caja_trabajo = sequelize.define(
    "caja_trabajo",
    {
      fecha_trabajo: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.DATEONLY
      },
      caja_codigo: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.STRING(7),
        references: {
          model: "caja",
          key: "caja_codigo"
        }
      },
      usuario_apertura: {
        type: DataTypes.STRING(20),
        references: {
          model: "cuenta_usuario",
          key: "usuario"
        }
      },
      fecha_hora_apertura: {
        type: DataTypes.DATE,
        validate: {
          isDate: true
        }
      },
      fecha_hora_cierre: {
        type: DataTypes.DATE,
        validate: {
          isDate: true
        }
      },
      usuario_cierre: {
        type: DataTypes.STRING(20),
        references: {
          model: "cuenta_usuario",
          key: "usuario"
        }
      },
      estado_caja: {
        type: DataTypes.STRING(10),
        validate: {
          is: {
            args: /^[a-z\d\-_\s]+$/i, //valida texto alfanumerico con espacios
            msg: "Campo debe contener solo letras y numeros"
          }
        }
      },
      Saldo1: {
        type: DataTypes.DECIMAL(10, 3),
        validate: {
          isNumeric: true
        }
      },
      Saldo2: {
        type: DataTypes.DECIMAL(10, 3),
        validate: {
          isNumeric: true
        }
      },
      Saldo3: {
        type: DataTypes.DECIMAL(10, 3),
        validate: {
          isNumeric: true
        }
      }
    },
    {
      freezeTableName: true
    }
  );

  caja_trabajo.removeAttribute("id");
  caja_trabajo.associate = function(models) {
    // associations can be defined here
    caja_trabajo.belongsTo(models.cuenta_usuario, {
      foreignKey: "usuario_apertura",
      targetKey: "usuario"
    });
    caja_trabajo.belongsTo(models.cuenta_usuario, {
      foreignKey: "usuario_cierre",
      targetKey: "usuario"
    });
    caja_trabajo.belongsTo(models.caja, {
      foreignKey: "caja_codigo",
      targetKey: "caja_codigo"
    });
    caja_trabajo.hasMany(models.operacion_caja, {
      foreignKey: "fecha_trabajo",
      sourceKey: "fecha_trabajo",
      scope: {
        caja_codigo: sequelize.where(sequelize.col("caja_trabajo.caja_codigo"), "=", sequelize.col("operacion_caja.caja_codigo"))
      }
    });
  };
  return caja_trabajo;
};
