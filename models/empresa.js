"use strict";
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database')

const crearModel = (sequelize, DataTypes) => {
	const empresa = sequelize.define(
		"empresa", {
			empresa_codigo: {
				allowNull: false,
				primaryKey: true,
				type: DataTypes.STRING(14)
			},
			razon_social: {
				allowNull: false,
				type: DataTypes.STRING(250),
				validate: {
					is: {
						args: /^[a-z\d\-_\.ñÑáéíóúÁÉÍÓÚ\s]+|$/i, //valida texto alfanumerico con espacios
						msg: "Campo debe contener solo letras y numeros"
					}
				}
			},
			ruc: {
				type: DataTypes.STRING(12),
				validate: {
					is: {
						args: /^[a-z\d\-_\.ñÑáéíóúÁÉÍÓÚ\s]+|$/i, //valida texto alfanumerico con espacios
						msg: "Campo debe contener solo letras y numeros"
					}
				}
			},
			contacto_nombre: {
				type: DataTypes.STRING(45),
				validate: {
					is: {
						args: /^[a-z\d\-_\.ñÑáéíóúÁÉÍÓÚ\s]+|$/i, //valida texto alfanumerico con espacios
						msg: "Campo debe contener solo letras y numeros"
					}
				}
			},
			contacto_nro: {
				type: DataTypes.STRING(20),
				validate: {
					is: {
						args: /^[a-z\d\-_\.ñÑáéíóúÁÉÍÓÚ\s]+|$/i, //valida texto alfanumerico con espacios
						msg: "Campo debe contener solo letras y numeros"
					}
				}
			},
			estado_registro: {
				type: DataTypes.BOOLEAN
			}
		}, {
			freezeTableName: true
		}
	);

	empresa.removeAttribute("id");
	empresa.associate = function (models) {
		// associations can be defined here
		empresa.hasMany(models.oficina, {
			foreignKey: "empresa_codigo",
			constraints: false
		});
		empresa.hasMany(models.cuenta_usuario, {
			foreignKey: "empresa_codigo",
			constraints: false
		});
	};
	return empresa;
};

module.exports = crearModel(sequelize, DataTypes)