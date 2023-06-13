const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class cuenta_usuario extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      cuenta_usuario.hasMany(models.tipo_conexion);
      cuenta_usuario.belongsTo(models.perfil, {
        foreignKey: 'perfil_codigo',
      });
    }
  }
  cuenta_usuario.init(
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
      sequelize,
      modelName: 'cuenta_usuario',
    },
  );
  cuenta_usuario.removeAttribute('id');
  return cuenta_usuario;
};
