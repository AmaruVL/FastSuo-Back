"use strict";
module.exports = (sequelize, DataTypes) => {
  const operacion_caja = sequelize.define(
    "operacion_caja",
    {
      documento_codigo: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.STRING(4),
        references: {
          model: "documento_serie",
          key: "documento_codigo"
        }
      },
      documento_serie: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.INTEGER,
        references: {
          model: "documento_serie",
          key: "documento_serie"
        }
      },
      nro_operacion: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.INTEGER,
        validate: {
          isInt: {
            //valida que sea numero entero
            args: true,
            msg: "Campo debe contener solo numeros"
          }
        }
      },
      id_cliente: {
        type: DataTypes.STRING(12),
        references: {
          model: "cliente_proveedor",
          key: "id_cliente"
        }
      },
      oficina_origen_codigo: {
        type: DataTypes.STRING(12),
        references: {
          model: "almacen",
          key: "oficina_codigo"
        },
        allowNull: false,
        validate: {
          notNull: {
            args: true,
            msg: "Campo oficina origen no debe estar vacío"
          }
        }
      },
      fecha_trabajo: {
        type: DataTypes.DATEONLY,
        references: {
          model: "caja_trabajo",
          key: "fecha_trabajo"
        }
      },
      caja_codigo: {
        type: DataTypes.STRING(7),
        references: {
          model: "caja_trabajo",
          key: "caja_codigo"
        }
      },
      cuenta_codigo: {
        type: DataTypes.STRING(8),
        references: {
          model: "cuenta",
          key: "cuenta_codigo"
        }
      },
      codigo_validador: {
        type: DataTypes.STRING(8),
        validate: {
          is: {
            args: /^[a-z\d\-_\.ñÑáéíóúÁÉÍÓÚ\s]+|$/i, //valida texto alfanumerico con espacios
            msg: "Campo debe contener solo letras y numeros"
          }
        }
      },
      nro_transaccion: {
        type: DataTypes.INTEGER,
        validate: {
          isInt: {
            //valida que sea numero entero
            args: true,
            msg: "Campo debe contener solo numeros"
          }
        }
      },
      nro_transaccion_dia: {
        type: DataTypes.INTEGER,
        validate: {
          isInt: {
            //valida que sea numero entero
            args: true,
            msg: "Campo debe contener solo numeros"
          }
        }
      },
      modulo: {
        type: DataTypes.STRING(12),
        validate: {
          is: {
            args: /^[a-z\d\-_\.ñÑáéíóúÁÉÍÓÚ\s]+|$/i, //valida texto alfanumerico con espacios
            msg: "Campo debe contener solo letras y numeros"
          }
        }
      },
      cliente_razon_social: {
        type: DataTypes.STRING(100),
        validate: {
          is: {
            args: /^[a-z\d\-_\.ñÑáéíóúÁÉÍÓÚ\s]+|$/i,
            msg: "Campo debe contener solo letras y numeros"
          }
        }
      },
      concepto: {
        type: DataTypes.STRING(400),
        validate: {
          is: {
            args: /^[a-z\d\-_\.ñÑáéíóúÁÉÍÓÚ\s]+|$/i,
            msg: "Campo debe contener solo letras y numeros"
          }
        }
      },
      fecha_hora_operacion: {
        type: DataTypes.DATE,
        validate: {
          isDate: true
        }
      },
      tipo_cambio: {
        type: DataTypes.DECIMAL(8, 4),
        validate: {
          isNumeric: true,
          min: 0
        }
      },
      usuario: {
        type: DataTypes.STRING(20),
        references: {
          model: "cuenta_usuario",
          key: "usuario"
        }
      },
      moneda1_Ingre: {
        type: DataTypes.DECIMAL(10, 2),
        isNumeric: {
          args: true,
          msg: "Campo moneda ingreso 1 debe ser un numero"
        }
      },
      moneda1_Egre: {
        type: DataTypes.DECIMAL(10, 2),
        validate: {
          isNumeric: {
            args: true,
            msg: "Campo moneda egreso 1 debe ser un numero"
          }
        }
      },
      moneda2_Ingre: {
        type: DataTypes.DECIMAL(10, 2),
        validate: {
          isNumeric: {
            args: true,
            msg: "Campo moneda ingreso 2 debe ser un numero"
          }
        }
      },
      moneda2_Egre: {
        type: DataTypes.DECIMAL(10, 2),
        validate: {
          isNumeric: {
            args: true,
            msg: "Campo moneda egreso 2 debe ser un numero"
          }
        }
      },
      moneda3_Ingre: {
        type: DataTypes.DECIMAL(10, 2),
        validate: {
          isNumeric: {
            args: true,
            msg: "Campo moneda ingreso 3 debe ser un numero"
          },
          min(value) {
            if (parseFloat(value) < 0) {
              throw new Error("Campo moneda ingreso 3 debe ser mayor a 0");
            }
          }
        }
      },
      moneda3_Egre: {
        type: DataTypes.DECIMAL(10, 2),
        validate: {
          isNumeric: {
            args: true,
            msg: "Campo moneda egreso 3 debe ser un numero"
          },
          min(value) {
            if (parseFloat(value) < 0) {
              throw new Error("Campo moneda egreso 3 debe ser mayor a 0");
            }
          }
        }
      },
      registrado_central: {
        type: DataTypes.BOOLEAN
      },
      estado_registro: {
        type: DataTypes.INTEGER
      }
    },
    {
      freezeTableName: true
    }
  );

  operacion_caja.removeAttribute("id");
  operacion_caja.associate = function(models) {
    // associations can be defined here
    operacion_caja.belongsTo(models.cuenta_usuario, {
      foreignKey: "usuario",
      targetKey: "usuario"
    });
    operacion_caja.belongsTo(models.cliente_proveedor, {
      foreignKey: "id_cliente",
      targetKey: "id_cliente"
    });
    operacion_caja.belongsTo(models.cuenta, {
      foreignKey: "cuenta_codigo",
      targetKey: "cuenta_codigo"
    });
    operacion_caja.belongsTo(models.caja_trabajo, {
      foreignKey: "fecha_trabajo",
      targetKey: "fecha_trabajo",
      scope: {
        caja_codigo: sequelize.where(sequelize.col("operacion_caja.caja_codigo"), "=", sequelize.col("caja_trabajo.caja_codigo"))
      }
    });
  };
  return operacion_caja;
};
