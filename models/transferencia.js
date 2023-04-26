"use strict";
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database')

const crearModel = (sequelize, DataTypes) => {
  const transferencia = sequelize.define("transferencia", {
    St_documento_codigo: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.STRING(4),
      references: {
        model: "operacion_caja",
        key: "documento_codigo"
      }
    },
    St_documento_serie: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.INTEGER,
      references: {
        model: "operacion_caja",
        key: "documento_serie"
      }
    },
    nro_Solicitud: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.INTEGER,
      references: {
        model: "operacion_caja",
        key: "nro_operacion"
      }
    },
    oficina_codigo_origen: {
      type: DataTypes.STRING(12),
      allowNull: false,
      references: {
        model: "oficina",
        key: "oficina_codigo"
      },
      validate: {
        notNull: {
          args: true,
          msg: "Campo oficina origen no debe estar vacío"
        }
      }
    },
    oficina_codigo_destino: {
      type: DataTypes.STRING(12),
      allowNull: false,
      references: {
        model: "oficina",
        key: "oficina_codigo"
      },
      validate: {
        notNull: {
          args: true,
          msg: "Campo oficina destino no debe estar vacío"
        }
      }
    },
    solicitud_fecha_hora: {
      type: DataTypes.DATE,
      validate: {
        isDate: true
      }
    },
    beneficiario_id_cliente: {
      type: DataTypes.STRING(12),
      references: {
        model: "cliente_proveedor",
        key: "id_cliente"
      }
    },
    beneficiario_razon_social: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        is: {
          args: /^[a-z\d\-_\.ñÑáéíóúÁÉÍÓÚ\s]+|$/i, //valida texto alfanumerico con espacios
          msg: "Campo debe contener solo letras y numeros"
        },
        notNull: {
          args: true,
          msg: "Campo beneficiario no debe estar vacío"
        }
      }
    },
    beneficiario_docident: {
      type: DataTypes.STRING(11),
      validate: {
        is: {
          args: /^[a-z\d\-_\.ñÑáéíóúÁÉÍÓÚ\s]+|$/i, //valida texto alfanumerico con espacios
          msg: "Campo debe contener solo letras y numeros"
        }
      }
    },
    beneficiario_otros_datos: {
      type: DataTypes.STRING(45),
      validate: {
        is: {
          args: /^[a-z\d\-_\.ñÑáéíóúÁÉÍÓÚ\s]+|$/i, //valida texto alfanumerico con espacios
          msg: "Campo debe contener solo letras y numeros"
        }
      }
    },
    solicitante_id_cliente: {
      type: DataTypes.STRING(12),
      references: {
        model: "cliente_proveedor",
        key: "id_cliente"
      }
    },
    solicitante_razon_social: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        is: {
          args: /^[a-z\d\-_\.ñÑáéíóúÁÉÍÓÚ\s]+|$/i, //valida texto alfanumerico con espacios
          msg: "Campo debe contener solo letras y numeros"
        },
        notNull: {
          args: true,
          msg: "Campo solicitante no debe estar vacío"
        }
      }
    },
    solicitante_otros_datos: {
      type: DataTypes.STRING(40),
      validate: {
        is: {
          args: /^[a-z\d\-_\.ñÑáéíóúÁÉÍÓÚ\s]+|$/i, //valida texto alfanumerico con espacios
          msg: "Campo debe contener solo letras y numeros"
        }
      }
    },
    moneda: {
      type: DataTypes.STRING(4),
      validate: {
        is: {
          args: /^[a-z\d\-_\.ñÑáéíóúÁÉÍÓÚ\s]+|$/i, //valida texto alfanumerico con espacios
          msg: "Campo debe contener solo letras y numeros"
        },
        isIn: {
          args: [["1", "2"]],
          msg: "Campo moneda incorrecto"
        }
      }
    },
    importe: {
      type: DataTypes.DECIMAL(10, 3),
      validate: {
        isNumeric: {
          args: true,
          msg: "Campo importe debe ser un numero"
        },
        min(value) {
          if (parseFloat(value) < 0) {
            throw new Error("Campo importe debe ser mayor a 0");
          }
        }
      }
    },
    importe_pagado: {
      type: DataTypes.DECIMAL(10, 3),
      validate: {
        isNumeric: true,
        min: 0
      }
    },
    comision_dt: {
      type: DataTypes.DECIMAL(7, 3),
      validate: {
        isNumeric: {
          args: true,
          msg: "Campo comision debe ser un numero"
        },
        min(value) {
          if (parseFloat(value) < 0) {
            throw new Error("Campo importe debe ser mayor a 0");
          }
        }
      }
    },
    comision_banco: {
      type: DataTypes.DECIMAL(7, 3),
      validate: {
        isNumeric: {
          args: true,
          msg: "Campo comision bancos debe ser un numero"
        },
        min(value) {
          if (parseFloat(value) < 0) {
            throw new Error("Campo importe debe ser mayor a 0");
          }
        }
      }
    },
    gastos_administrativos: {
      type: DataTypes.DECIMAL(7, 3),
      validate: {
        isNumeric: {
          args: true,
          msg: "Campo gastos administrativos debe ser un numero"
        },
        min(value) {
          if (parseFloat(value) < 0) {
            throw new Error("Campo importe debe ser mayor a 0");
          }
        }
      }
    },
    deposito_entidad_codigo: {
      type: DataTypes.STRING(12),
      references: {
        model: "entidad_financiera_servicios",
        key: "entidad_codigo"
      }
    },
    beneficiario_nro_celular: {
      type: DataTypes.STRING(12),
      allowNull: true
    },
    solicitante_nro_celular: {
      type: DataTypes.STRING(12),
      allowNull: true
    },
    deposito_tipo: {
      type: DataTypes.STRING(30),
      validate: {
        is: {
          args: /^[a-z\d\-_\.ñÑáéíóúÁÉÍÓÚ\s]+|$/i, //valida texto alfanumerico con espacios
          msg: "Campo debe contener solo letras y numeros"
        }
      }
    },
    deposito_destino: {
      type: DataTypes.STRING(100),
      validate: {
        is: {
          args: /^[a-z\d\-_\.ñÑáéíóúÁÉÍÓÚ\s]+|$/i, //valida texto alfanumerico con espacios
          msg: "Campo debe contener solo letras y numeros"
        }
      }
    },
    deposito_nro_cuenta: {
      type: DataTypes.STRING(50),
      validate: {
        is: {
          args: /^[a-z\d\-_\.ñÑáéíóúÁÉÍÓÚ\s]+|$/i, //valida texto alfanumerico con espacios
          msg: "Campo debe contener solo letras y numeros"
        }
      }
    },
    deposito_nro_operacion: {
      type: DataTypes.STRING(15),
      validate: {
        is: {
          args: /^[a-z\d\-_\.ñÑáéíóúÁÉÍÓÚ\s]+|$/i, //valida texto alfanumerico con espacios
          msg: "Campo debe contener solo letras y numeros"
        }
      }
    },
    solicitud_obs: {
      type: DataTypes.STRING(400),
      validate: {
        is: {
          args: /^[a-z\d\-_\.ñÑáéíóúÁÉÍÓÚ\s]+|$/i, //valida texto alfanumerico con espacios
          msg: "Campo debe contener solo letras y numeros"
        }
      }
    },
    autorizacion_fecha_hora: {
      type: DataTypes.DATE,
      validate: {
        isDate: true
      }
    },
    autorizacion_usuario: {
      type: DataTypes.STRING(20),
      references: {
        model: "cuenta_usuario",
        key: "usuario"
      }
    },
    autorizacion_estado: {
      type: DataTypes.BOOLEAN
    },
    st_autorizada: {
      type: DataTypes.INTEGER
    },
    anulacion_usuario: {
      type: DataTypes.STRING(20),
      references: {
        model: "cuenta_usuario",
        key: "usuario"
      }
    },
    anulacion_motivo: {
      type: DataTypes.STRING(40),
      validate: {
        is: {
          args: /^[a-z\d\-_\.ñÑáéíóúÁÉÍÓÚ\s]+|$/i, //valida texto alfanumerico con espacios
          msg: "Campo debe contener solo letras y numeros"
        }
      }
    },
    anulacion_fecha_hora: {
      type: DataTypes.DATE,
      validate: {
        isDate: true
      }
    },
    op_usuario: {
      type: DataTypes.STRING(20),
      references: {
        model: "cuenta_usuario",
        key: "usuario"
      }
    },
    op_documento_codigo: {
      type: DataTypes.STRING(4),
      references: {
        model: "operacion_caja",
        key: "documento_codigo"
      }
    },
    op_documento_serie: {
      type: DataTypes.INTEGER,
      references: {
        model: "operacion_caja",
        key: "documento_serie"
      }
    },
    op_nro_operacion: {
      type: DataTypes.INTEGER,
      references: {
        model: "operacion_caja",
        key: "nro_operacion"
      }
    },
    op_fecha_hora: {
      type: DataTypes.DATE,
      validate: {
        isDate: true
      }
    },
    op_observacion: {
      type: DataTypes.STRING(120),
      validate: {
        is: {
          args: /^[a-z\d\-_\.ñÑáéíóúÁÉÍÓÚ\s]+|$/i, //valida texto alfanumerico con espacios
          msg: "Campo debe contener solo letras y numeros"
        }
      }
    },
    st_estado: {
      type: DataTypes.INTEGER,
      validate: {
        isInt: {
          //valida que sea numero entero
          args: true,
          msg: "Campo debe contener solo numeros"
        }
      }
    },
    tipo_giro: {
      type: DataTypes.STRING(20)
    },
    solicitud_msj: {
      type: DataTypes.STRING(90)
    },
    foto: {
      type: DataTypes.BOOLEAN
    },
    dictado_usuario: {
      type: DataTypes.STRING(20),
      references: {
        model: "cuenta_usuario",
        key: "usuario"
      }
    },
    dictado_fecha_hora: {
      type: DataTypes.DATE,
      validate: {
        isDate: true
      }
    },
    id_centro_poblado_destino: {
      type: DataTypes.INTEGER,
      references: {
        model: "centro_poblado",
        key: "id_centro_poblado"
      }
    }
  });

  transferencia.removeAttribute("id");
  transferencia.associate = function(models) {
    // associations can be defined here
    transferencia.belongsTo(models.operacion_caja, {
      foreignKey: "St_documento_codigo",
      targetKey: "documento_codigo"
      /*,
			scope: {
				caja_codigo: sequelize.where(
					sequelize.col("transferencia.St_docuento_serie"),
					"=",
					sequelize.col("operacion_caja.documento_serie")
				)
			}*/
    });
    transferencia.belongsTo(models.cuenta_usuario, {
      foreignKey: "autorizacion_usuario",
      targetKey: "usuario"
    });
    transferencia.belongsTo(models.cuenta_usuario, {
      foreignKey: "anulacion_usuario",
      targetKey: "usuario"
    });
    transferencia.belongsTo(models.cuenta_usuario, {
      foreignKey: "op_usuario",
      targetKey: "usuario"
    });
    transferencia.belongsTo(models.cuenta_usuario, {
      foreignKey: "dictado_usuario",
      targetKey: "usuario"
    });
    transferencia.belongsTo(models.oficina, {
      as: "oficinaOrigen",
      foreignKey: "oficina_codigo_origen",
      targetKey: "oficina_codigo"
    });
    transferencia.belongsTo(models.oficina, {
      as: "oficinaDestino",
      foreignKey: "oficina_codigo_destino",
      targetKey: "oficina_codigo"
    });
    transferencia.belongsTo(models.entidad_financiera_servicios, {
      as: "banco",
      foreignKey: "deposito_entidad_codigo",
      targetKey: "entidad_codigo"
    });
    transferencia.belongsTo(models.cliente_proveedor, {
      as: "beneficiario",
      foreignKey: "beneficiario_id_cliente",
      targetKey: "id_cliente"
    });
    transferencia.belongsTo(models.cliente_proveedor, {
      foreignKey: "solicitante_id_cliente",
      targetKey: "id_cliente"
    });
  };
  return transferencia;
};

module.exports = crearModel(sequelize, DataTypes)