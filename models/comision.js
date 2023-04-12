"use strict";
module.exports = (sequelize, DataTypes) => {
	const comision = sequelize.define(
		"comision", {
			id_comision: {
				primaryKey: true,
				autoIncrement: true,
				type: DataTypes.INTEGER
			},
			oficina_codigo: {
				allowNull: false,
				type: DataTypes.STRING(12),
				references: {
					model: "oficina",
					key: "oficina_codigo"
				}
			},
			monto_minimo: {
				type: DataTypes.DECIMAL(8, 2),
				validate: {
					isNumeric: true,
					min: 0,
				}
			},
			monto_maximo: {
				type: DataTypes.DECIMAL(8, 2),
				validate: {
					isNumeric: true,
					min: 0,
				}
			},
			comision: {
				type: DataTypes.NUMERIC(8, 3),
				validate: {
					isNumeric: true,
					min: 0,
				}
			},
			tipo_comision: {
				type: DataTypes.STRING(10),
				validate: {
					is: {
						args: /^[a-z\d\-_\s]+$/i, //valida texto alfanumerico con espacios
						msg: "Campo debe contener solo letras y numeros"
					}
				}
			}
		}, {
			freezeTableName: true
		}
	);

	comision.removeAttribute("id");
	comision.associate = function (models) {
		// associations can be defined here
		comision.belongsTo(models.oficina, {
			foreignKey: "oficina_codigo",
			constraints: false
		});
	};
	return comision;
};