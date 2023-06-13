const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const cuenta_usuario = sequelize.define(
  'cuenta_usuario',
  {
    usuario: {
      primaryKey: true,
      allowNull: false,
      type: DataTypes.STRING(20),
    },
    contrasena: {
      type: DataTypes.STRING(128),
    },
    usuario_nombre: {
      type: DataTypes.STRING(45),
      validate: {
        is: {
          args: /^[a-z\d\-_\.ñÑáéíóúÁÉÍÓÚ\s]+|$/i, // valida texto alfanumerico con espacios
          msg: 'Campo debe contener solo letras y numeros',
        },
      },
    },
    pregunta_secreta: {
      type: DataTypes.STRING(60),
      validate: {
        is: {
          args: /^[a-z\d\-_\.ñÑáéíóúÁÉÍÓÚ\s]+|$/i, // valida texto alfanumerico con espacios
          msg: 'Campo debe contener solo letras y numeros',
        },
      },
    },
    respuesta: {
      type: DataTypes.STRING(60),
      validate: {
        is: {
          args: /^[a-z\d\-_\.ñÑáéíóúÁÉÍÓÚ\s]+|$/i, // valida texto alfanumerico con espacios
          msg: 'Campo debe contener solo letras y numeros',
        },
      },
    },
    contrasena_old: {
      type: DataTypes.STRING(128),
    },
    pc_sn: {
      type: DataTypes.STRING(50),
    },
    estado_registro: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    perfil_codigo: {
      type: DataTypes.SMALLINT,
      references: {
        model: 'perfil',
        key: 'perfil_codigo',
      },
      validate: {
        isInt: {
          // valida que sea numero entero
          args: true,
          msg: 'Campo debe contener solo numeros',
        },
      },
    },
    puede_editar_DT: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    modo_conexion: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    tipo_arqueo: {
      type: DataTypes.STRING(30),
    },
  },
  {
    freezeTableName: true,
  },
);

cuenta_usuario.removeAttribute('id');
cuenta_usuario.associate = function (models) {
  cuenta_usuario.belongsTo(models.perfil, {
    foreignKey: 'perfil_codigo',
    targetKey: 'perfil_codigo',
  });
};

module.exports = cuenta_usuario;
