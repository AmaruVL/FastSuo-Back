"use strict";
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database')

const crearModel = (sequelize, DataTypes) => {
  const caja = sequelize.define(
    "caja",
    {
      caja_codigo: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.STRING(7)
      },
      caja_nombre: {
        type: DataTypes.STRING(120),
        validate: {
          /*is: {
						args: /^[a-z\d\-_\s]+$/i, //valida texto alfanumerico con espacios
						msg: "Campo debe contener solo letras y numeros"
					}*/
        }
      },
      direccion_ip_acceso: {
        type: DataTypes.STRING(35),
        validate: {
          isIP: {
            args: true,
            msg: "IP invalido"
          }
        }
      },
      direccion_mac: {
        type: DataTypes.STRING(17)
      },
      caja_contrasena: {
        type: DataTypes.STRING(120)
      },
      almacen_defecto: {
        type: DataTypes.STRING(18)
        /*validate: {
					is: {
						args: /^[a-z\d\-_\s]+$/i, //valida texto alfanumerico con espacios
						msg: "Campo debe contener solo letras y numeros"
					}
				}*/
      },
      caja_bitacora: {
        type: DataTypes.STRING(250),
        validate: {
          /*is: {
						args: /^[a-z\d\-_\s]+$/i, //valida texto alfanumerico con espacios
						msg: "Campo debe contener solo letras y numeros"
					}*/
        }
      },
      estado_registro: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      verificar_saldo_caja: {
        type: DataTypes.STRING(30)
      },
      oficina_codigo: {
        type: DataTypes.STRING(12),
        references: {
          model: "oficina",
          key: "oficina_codigo"
        },
        validate: {
          is: {
            args: /^[a-z\d\-_\s]+$/i, //valida texto alfanumerico con espacios
            msg: "Campo debe contener solo letras y numeros"
          }
        }
      }
    },
    {
      freezeTableName: true
    }
  );

  caja.removeAttribute("id");
  caja.associate = function(models) {
    // associations can be defined here
    caja.belongsTo(models.oficina, {
      foreignKey: "oficina_codigo",
      constraints: false
    });
    caja.hasMany(models.habilitacion, {
      as: "caja_origen",
      foreignKey: "origen_caja_codigo",
      sourceKey: "caja_codigo"
    });
    caja.hasMany(models.habilitacion, {
      as: "caja_destino",
      foreignKey: "destino_caja_codigo",
      sourceKey: "caja_codigo"
    });
    caja.hasMany(models.cuenta_usuario, {
      as: "cuenta_usuario",
      foreignKey: "caja_codigo",
      sourceKey: "caja_codigo"
    });
  };
  return caja;
};

module.exports = crearModel(sequelize, DataTypes)