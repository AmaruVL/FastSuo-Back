"use strict";
module.exports = (sequelize, DataTypes) => {
	const documento_serie = sequelize.define(
		"documento_serie",
		{
			documento_codigo: {
				allowNull: false,
				primaryKey: true,
				type: DataTypes.STRING(4),
				references: {
					model: "documento",
					key: "documento_codigo"
				},
				onDelete: "SET NULL",
				onUpdate: "CASCADE"
			},
			documento_serie: {
				allowNull: false,
				primaryKey: true,
				type: DataTypes.INTEGER
			},
			nro_inicio: {
				type: DataTypes.INTEGER
			},
			fecha_activacion: {
				type: DataTypes.DATEONLY
			},
			fecha_baja: {
				type: DataTypes.DATEONLY
			},
			afecto: {
				type: DataTypes.BOOLEAN
			},
			formato: {
				type: DataTypes.STRING(40)
			},
			estado_registro: {
				type: DataTypes.BOOLEAN
			},
			oficina_codigo: {
				type: DataTypes.STRING(12),
				references: {
					model: "oficina",
					key: "oficina_codigo"
				}
			},
			modulo: {
				type: DataTypes.STRING(12)
			}
		},
		{
			freezeTableName: true
		}
	);

	documento_serie.removeAttribute("id");
	documento_serie.associate = function(models) {
		// associations can be defined here
		documento_serie.belongsTo(models.oficina, {
			foreignKey: "oficina_codigo",
			constraints: false
		});
		documento_serie.belongsTo(models.documento, {
			foreignKey: "documento_codigo",
			constraints: false
		});
	};
	return documento_serie;
};
