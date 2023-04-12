"use strict";
module.exports = (sequelize, DataTypes) => {
	const claveValor = sequelize.define(
		"configuracion",
		{
			clave: {
				allowNull: false,
				primaryKey: true,
				type: DataTypes.STRING(12),
				references: {
					model: "oficina",
					key: "oficina_codigo"
				}
			},
			valor: {
				type: DataTypes.DECIMAL(8, 2),
				validate: {
					isNumeric: true,
					min: 0
				}
			}
		},
		{
			freezeTableName: true
		}
	);

	claveValor.associate = function(models) {
		// associations can be defined here
	};
	return claveValor;
};
