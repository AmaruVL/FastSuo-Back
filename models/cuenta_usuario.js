"use strict";
module.exports = (sequelize, DataTypes) => {
  const cuenta_usuario = sequelize.define(
    "cuenta_usuario",
    {
      usuario: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.STRING(20)
      },
      contrasena: {
        type: DataTypes.STRING(128)
      },
      usuario_nombre: {
        type: DataTypes.STRING(45),
        validate: {
          is: {
            args: /^[a-z\d\-_\.ñÑáéíóúÁÉÍÓÚ\s]+|$/i, //valida texto alfanumerico con espacios
            msg: "Campo debe contener solo letras y numeros"
          }
        }
      },
      pregunta_secreta: {
        type: DataTypes.STRING(60),
        validate: {
          is: {
            args: /^[a-z\d\-_\.ñÑáéíóúÁÉÍÓÚ\s]+|$/i, //valida texto alfanumerico con espacios
            msg: "Campo debe contener solo letras y numeros"
          }
        }
      },
      respuesta: {
        type: DataTypes.STRING(60),
        validate: {
          is: {
            args: /^[a-z\d\-_\.ñÑáéíóúÁÉÍÓÚ\s]+|$/i, //valida texto alfanumerico con espacios
            msg: "Campo debe contener solo letras y numeros"
          }
        }
      },
      contrasena_old: {
        type: DataTypes.STRING(128)
      },
      pc_sn: {
        type: DataTypes.STRING(50)
      },
      estado_registro: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      empresa_codigo: {
        type: DataTypes.STRING(14),
        references: {
          model: "empresa",
          key: "empresa_codigo"
        },
        validate: {
          is: {
            args: /^[a-z\d\-_\.ñÑáéíóúÁÉÍÓÚ\s]+|$/i, //valida texto alfanumerico con espacios
            msg: "Campo debe contener solo letras y numeros"
          }
        }
      },
      caja_codigo: {
        type: DataTypes.STRING(7),
        references: {
          model: "caja",
          key: "caja_codigo"
        },
        validate: {
          is: {
            args: /^[a-z\d\-_\.ñÑáéíóúÁÉÍÓÚ\s]+|$/i, //valida texto alfanumerico con espacios
            msg: "Campo debe contener solo letras y numeros"
          }
        }
      },
      perfil_codigo: {
        type: DataTypes.SMALLINT,
        references: {
          model: "perfil",
          key: "perfil_codigo"
        },
        validate: {
          isInt: {
            //valida que sea numero entero
            args: true,
            msg: "Campo debe contener solo numeros"
          }
        }
      },
      puede_editar_DT: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      modo_conexion: {
        type: DataTypes.INTEGER,
        defaultValue: 1
      },
      tipo_arqueo: {
        type: DataTypes.STRING(30)
      }
    },
    {
      freezeTableName: true
    }
  );

  cuenta_usuario.removeAttribute("id");
  cuenta_usuario.associate = function(models) {
    // associations can be defined here
    cuenta_usuario.belongsTo(models.perfil, {
      foreignKey: "perfil_codigo",
      targetKey: "perfil_codigo"
    });
    cuenta_usuario.belongsTo(models.empresa, {
      foreignKey: "empresa_codigo",
      constraints: false
    });
    cuenta_usuario.belongsTo(models.caja, {
      foreignKey: "caja_codigo",
      targetKey: "caja_codigo"
    });
    cuenta_usuario.hasMany(models.transferencia, {
      foreignKey: "autorizacion_usuario",
      sourceKey: "usuario"
    });
    cuenta_usuario.hasMany(models.transferencia, {
      foreignKey: "anulacion_usuario",
      sourceKey: "usuario"
    });
    cuenta_usuario.hasMany(models.transferencia, {
      foreignKey: "op_usuario",
      sourceKey: "usuario"
    });
    cuenta_usuario.hasMany(models.caja_trabajo, {
      foreignKey: "usuario_apertura",
      sourceKey: "usuario"
    });
    cuenta_usuario.hasMany(models.caja_trabajo, {
      foreignKey: "usuario_cierre",
      sourceKey: "usuario"
    });
    cuenta_usuario.hasMany(models.st_check, {
      foreignKey: "usuario_check",
      sourceKey: "usuario"
    });
    cuenta_usuario.hasMany(models.operacion_caja, {
      foreignKey: "usuario",
      sourceKey: "usuario"
    });
    cuenta_usuario.hasMany(models.notificacion, {
      foreignKey: "usuario_registro",
      sourceKey: "usuario"
    });
  };
  return cuenta_usuario;
};
