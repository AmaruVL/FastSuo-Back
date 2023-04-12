"use strict";
module.exports = (sequelize, DataTypes) => {
  const tipo_conexion = sequelize.define(
    "tipo_conexion",
    {
      usuario:{
        allowNull: false,
        primaryKey: true,
        type: DataTypes.STRING(20),
        references:{
            model:"cuenta_usuario",
            key: "usuario"
        }
      },
      fecha_trabajo: {
        allowNull: false,
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
      fecha_hora_apertura: {
        type: DataTypes.DATE,
        validate: {
          isDate: true
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
      tipo_conexion_sistema_op: {
        type: DataTypes.STRING(255),
      },
      tipo_conexion_navegador: {
        type: DataTypes.STRING(255),
      },
      tipo_dispositivo: {
        type: DataTypes.STRING(250),
      },
      pc_movil_marca: {
        type: DataTypes.STRING(250),
      },
      pc_movil_modelo: {
        type: DataTypes.STRING(250),
      }
    },
    {
      freezeTableName: true
    }
  );

  tipo_conexion.removeAttribute("id");
  tipo_conexion.associate = function(models) {
    // associations can be defined here
    tipo_conexion.belongsTo(models.cuenta_usuario, {
      foreignKey: "usuario",
      targetKey: "usuario"
    });
    tipo_conexion.belongsTo(models.caja, {
      foreignKey: "caja_codigo",
      targetKey: "caja_codigo"
    });
    tipo_conexion.hasMany(models.operacion_caja, {
      foreignKey: "fecha_trabajo",
      sourceKey: "fecha_trabajo",
      scope: {
        caja_codigo: sequelize.where(sequelize.col("caja_trabajo.caja_codigo"), "=", sequelize.col("operacion_caja.caja_codigo"))
      }
    });
  };
  return tipo_conexion;
};
