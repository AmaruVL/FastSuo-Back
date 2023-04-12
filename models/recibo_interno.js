"use strict";
module.exports = (sequelize, DataTypes) => {
  const recibo_interno = sequelize.define(
    "recibo_interno",
    {
      recibo_doc_codigo: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.STRING(4),
        references: {
          model: "operacion_caja",
          key: "documento_codigo"
        }
      },
      recibo_doc_serie: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.INTEGER,
        references: {
          model: "operacion_caja",
          key: "documento_serie"
        }
      },
      recibo_nro: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.INTEGER,
        references: {
          model: "operacion_caja",
          key: "nro_operacion"
        }
      },
      cuenta_codigo: {
        type: DataTypes.STRING(8),
        references: {
          model: "cuenta",
          key: "cuenta_codigo"
        }
      },
      id_cliente: {
        type: DataTypes.STRING(12),
        references: {
          model: "cliente_proveedor",
          key: "id_cliente"
        }
      },
      recibo_tipo: {
        type: DataTypes.STRING(20)
      },
      razon_social: {
        type: DataTypes.STRING(100)
      },
      recibo_concepto: {
        type: DataTypes.STRING(50)
      },
      moneda: {
        type: DataTypes.STRING(7)
      },
      importe: {
        type: DataTypes.DECIMAL(10.3),
        validate: {
          isNumeric: true,
          min: 0
        }
      },
      recibo_obs: {
        type: DataTypes.STRING(120)
      },
      recibo_finalidad: {
        type: DataTypes.STRING(30)
      },
      centro_costo_id: {
        type: DataTypes.STRING(12),
        references: {
          model: "centro_costo",
          key: "centro_costo_id"
        }
      },
      recibo_fecha_hora: {
        type: DataTypes.DATE,
        validate: {
          isDate: true
        }
      },
      estado_registro: {
        type: DataTypes.INTEGER
      },
      anulacion_doc_codigo: {
        type: DataTypes.STRING(4),
        references: {
          model: "operacion_caja",
          key: "documento_codigo"
        }
      },
      anulacion_doc_serie: {
        type: DataTypes.INTEGER,
        references: {
          model: "operacion_caja",
          key: "documento_serie"
        }
      },
      anulacion_recibo_nro: {
        type: DataTypes.INTEGER,
        references: {
          model: "operacion_caja",
          key: "nro_operacion"
        }
      }
    },
    {
      freezeTableName: true
    }
  );

  recibo_interno.removeAttribute("id");
  recibo_interno.associate = function(models) {
    // associations can be defined here
    recibo_interno.belongsTo(models.cuenta, {
      foreignKey: "cuenta_codigo",
      targetKey: "cuenta_codigo"
    });
    recibo_interno.belongsTo(models.cliente_proveedor, {
      foreignKey: "id_cliente",
      targetKey: "id_cliente"
    });
    recibo_interno.belongsTo(models.centro_costo, {
      foreignKey: "centro_costo_id",
      targetKey: "centro_costo_id"
    });
  };
  return recibo_interno;
};
