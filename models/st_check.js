"use strict";
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database')

const crearModel = (sequelize, DataTypes) => {
	const st_check = sequelize.define(
		"st_check", {
			St_documento_codigo: {
				allowNull: false,
				primaryKey: true,
				type: DataTypes.STRING(4),
				references: {
					model: "transferencia",
					key: "St_documento_codigo"
				}
			},
			St_documento_serie: {
				allowNull: false,
				primaryKey: true,
				type: DataTypes.INTEGER,
				references: {
					model: "transferencia",
					key: "St_documento_serie"
				}
			},
			nro_Solicitud: {
				allowNull: false,
				primaryKey: true,
				type: DataTypes.INTEGER,
				references: {
					model: "transferencia",
					key: "nro_Solicitud"
				}
			},
			check: {
				type: DataTypes.BOOLEAN
			},
			dt_origen: {
				type: DataTypes.DECIMAL(7, 2),
				validate: {
					isNumeric: true,
					min: 0,
				}
			},
			dt_origen_comision: {
				type: DataTypes.DECIMAL(7, 2),
				validate: {
					isNumeric: true,
					min: 0,
				}
			},
			dt_destino: {
				type: DataTypes.DECIMAL(7, 2),
				validate: {
					isNumeric: true,
					min: 0,
				}
			},
			dt_destino_comision: {
				type: DataTypes.DECIMAL(7, 2),
				validate: {
					isNumeric: true,
					min: 0,
				}
			},
			usuario_check: {
				type: DataTypes.STRING(20),
				references: {
					model: "cuenta_usuario",
					key: "usuario"
				}
			},
			check_fecha_hora: {
				type: DataTypes.DATE,
				validate: {
					isDate: true
				}
			}
		}, {
			freezeTableName: true
		}
	);

	st_check.removeAttribute("id");
	st_check.associate = function (models) {
		// associations can be defined here
		st_check.belongsTo(models.cuenta_usuario, {
			foreignKey: "usuario_check",
			targetKey: "usuario"
		});
	};
	return st_check;
};

module.exports = crearModel(sequelize, DataTypes)