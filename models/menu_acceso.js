"use strict";
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database')

const crearModel = (sequelize, DataTypes) => {
	const menu_acceso = sequelize.define(
		"menu_acceso",
		{
			menu_codigo: {
				allowNull: false,
				type: DataTypes.STRING(6),
				primaryKey: true
			},
			menu_etiqueta: {
				allowNull: false,
				type: DataTypes.STRING(20),
				validate: {
					is: {
						args: /^[a-z\d\-_\s]+$/i, //valida texto alfanumerico con espacios
						msg: "Campo debe contener solo letras y numeros"
					}
				}
			},
			descripcion: {
				allowNull: false,
				type: DataTypes.STRING(20),
				validate: {
					is: {
						args: /^[a-z\d\-_\s]+$/i, //valida texto alfanumerico con espacios
						msg: "Campo debe contener solo letras y numeros"
					}
				}
			},
			nivel: {
				allowNull: false,
				type: DataTypes.SMALLINT,
				validate: {
					isInt: {
						//valida que sea numero entero
						args: true,
						msg: "Campo debe contener solo numeros"
					}
				}
			},
			modulo: {
				type: DataTypes.STRING(20),
				validate: {
					is: {
						args: /^[a-z\d\-_\s]+$/i, //valida texto alfanumerico con espacios
						msg: "Campo debe contener solo letras y numeros"
					}
				}
			},
			tipo_modulo: {
				type: DataTypes.STRING(20),
				validate: {
					is: {
						args: /^[a-z\d\-_\s]+$/i, //valida texto alfanumerico con espacios
						msg: "Campo debe contener solo letras y numeros"
					}
				}
			},
			imagen: {
				type: DataTypes.STRING(30),
				validate: {
					is: {
						args: /^[a-z\d\-_./\s]+$/i, //valida texto alfanumerico con espacios
						msg: "Campo debe contener solo letras y numeros"
					}
				}
			},
			ambito_acceso: {
				type: DataTypes.STRING(15),
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

	menu_acceso.removeAttribute("id");
	menu_acceso.associate = function(models) {
		menu_acceso.belongsToMany(models.perfil, {
			through: models.lista_menu,
			foreignKey: "menu_codigo",
			otherKey: "perfil_codigo"
		});
	};
	return menu_acceso;
};

module.exports = crearModel(sequelize, DataTypes)