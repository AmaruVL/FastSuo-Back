"use strict";
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database')

const crearModel = (sequelize, DataTypes) => {
	const cliente_proveedor = sequelize.define(
		"cliente_proveedor", {
			id_cliente: {
				primaryKey: true,
				allowNull: false,
				type: DataTypes.STRING(12)
			},
			cliente_tipo_persona: {
				type: DataTypes.STRING(9)
			},
			nombres: {
				type: DataTypes.STRING(35)
			},
			ap_paterno: {
				type: DataTypes.STRING(30)
			},
			ap_materno: {
				type: DataTypes.STRING(30)
			},
			razon_social: {
				type: DataTypes.STRING(100)
			},
			sexo: {
				type: DataTypes.BOOLEAN
			},
			fecha_nacimiento: {
				type: DataTypes.DATEONLY
			},
			nro_fijo: {
				type: DataTypes.STRING(12)
			},
			nro_movil: {
				type: DataTypes.STRING(12)
			},
			correo: {
				type: DataTypes.STRING(40)
			},
			direccion: {
				type: DataTypes.STRING(50)
			}
		}, {
			freezeTableName: true
		}
	);

	cliente_proveedor.removeAttribute("id");
	cliente_proveedor.associate = function (models) {
		// associations can be defined here
		cliente_proveedor.hasMany(models.transferencia, {
			foreignKey: "beneficiario_id_cliente",
			sourceKey: "id_cliente"
		});
		cliente_proveedor.hasMany(models.transferencia, {
			foreignKey: "solicitante_id_cliente",
			sourceKey: "id_cliente"
		});
		cliente_proveedor.hasMany(models.operacion_caja, {
			foreignKey: "id_cliente",
			sourceKey: "id_cliente"
		});
		cliente_proveedor.hasMany(models.recibo_interno, {
			foreignKey: "id_cliente",
			sourceKey: "id_cliente"
		});
	};
	return cliente_proveedor;
};

module.exports = crearModel(sequelize, DataTypes)