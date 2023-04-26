"use strict";
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database')

const crearModel = (sequelize, DataTypes) => {
  const lista_menu = sequelize.define('lista_menu', {
    menu_codigo: {
      primaryKey: true,
      allowNull: false,
      type: DataTypes.STRING(6),
      reference: {
        model: 'menu_acceso',
        key: 'menu_codigo'
      }
    },
    perfil_codigo: {
      primaryKey: true,
      allowNull: false,
      type: DataTypes.SMALLINT,
      reference: {
        model: 'perfil',
        key: 'perfil_codigo'
      }
    },
    nivel_acceso: {
      allowNull: false,
      type: DataTypes.SMALLINT,
      validate: {
        isInt: { //valida que sea numero entero
          args: true,
          msg: "Campo debe contener solo numeros"
        }
      }
    },
  }, {
    freezeTableName: true,
  });
  lista_menu.removeAttribute('id')

  lista_menu.associate = function (models) {

  };
  return lista_menu;
};

module.exports = crearModel(sequelize, DataTypes)