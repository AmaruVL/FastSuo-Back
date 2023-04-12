"use strict";

module.exports = (sequelize, DataTypes) => {
  const habilitacion = sequelize.define(
    "habilitacion",
    {
      origen_docu_codigo: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.STRING(4),
        references: {
          model: "operacion_caja",
          key: "documento_codigo"
        }
      },
      origen_docu_serie: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.INTEGER,
        references: {
          model: "operacion_caja",
          key: "documento_serie"
        }
      },
      origen_nro_operacion: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.INTEGER,
        references: {
          model: "operacion_caja",
          key: "nro_operacion"
        }
      },
      tipo_habilitacion: {
        type: DataTypes.STRING(15)
      },
      destino_documento_codigo: {
        type: DataTypes.STRING(4),
        references: {
          model: "operacion_caja",
          key: "documento_codigo"
        }
      },
      destino_documento_serie: {
        type: DataTypes.INTEGER,
        references: {
          model: "operacion_caja",
          key: "documento_serie"
        }
      },
      destino_nro_operacion: {
        type: DataTypes.INTEGER,
        references: {
          model: "operacion_caja",
          key: "nro_operacion"
        }
      },
      origen_caja_codigo: {
        type: DataTypes.STRING(7),
        references: {
          model: "caja",
          key: "caja_codigo"
        }
      },
      destino_oficina_codigo: {
        type: DataTypes.STRING(12),
        references: {
          model: "oficina",
          key: "oficina_codigo"
        }
      },
      destino_caja_codigo: {
        type: DataTypes.STRING(7),
        references: {
          model: "caja",
          key: "caja_codigo"
        }
      },
      origen_oficina_codigo: {
        type: DataTypes.STRING(12),
        references: {
          model: "oficina",
          key: "oficina_codigo"
        }
      },
      encargado_operacion_id_cliente: {
        type: DataTypes.STRING(12),
        references: {
          model: "cliente_proveedor",
          key: "id_cliente"
        }
      },
      importe: {
        type: DataTypes.DECIMAL(10, 3),
        validate: {
          isNumeric: true
        }
      },
      moneda: {
        type: DataTypes.STRING(10)
      },
      habilitacion_estado: {
        type: DataTypes.STRING(9)
      },
      autorizada: {
        type: DataTypes.INTEGER,
        defaultValue: 1
      },
      usuario_autorizacion: {
        type: DataTypes.STRING(20),
        references: {
          model: "cuenta_usuario",
          key: "usuario"
        }
      },
      fecha_hora_autorizacion: {
        type: DataTypes.DATE,
        validate: {
          isDate: true
        }
      }
    },
    {
      freezeTableName: true
    }
  );

  habilitacion.removeAttribute("id");
  habilitacion.associate = function(models) {
    // associations can be defined here
    habilitacion.belongsTo(models.oficina, {
      as: "oficina_origen",
      foreignKey: "origen_oficina_codigo",
      targetKey: "oficina_codigo",
      constraints: false
    });
    habilitacion.belongsTo(models.oficina, {
      as: "oficina_destino",
      foreignKey: "destino_oficina_codigo",
      targetKey: "oficina_codigo",
      constraints: false
    });
    habilitacion.belongsTo(models.caja, {
      as: "caja_origen",
      foreignKey: "origen_caja_codigo",
      targetKey: "caja_codigo",
      constraints: false
    });
    habilitacion.belongsTo(models.caja, {
      as: "caja_destino",
      foreignKey: "destino_caja_codigo",
      targetKey: "caja_codigo",
      constraints: false
    });
    habilitacion.belongsTo(models.operacion_caja, {
      as: "operacion_origen",
      foreignKey: "origen_docu_codigo",
      targetKey: "caja_codigo",
      constraints: false
    });
    habilitacion.belongsTo(models.operacion_caja, {
      as: "operacion_destino",
      foreignKey: "destino_caja_codigo",
      targetKey: "caja_codigo",
      constraints: false
    });
    habilitacion.belongsTo(models.cuenta_usuario, {
      foreignKey: "usuario_autorizacion",
      targetKey: "usuario"
    });
  };
  return habilitacion;
};
