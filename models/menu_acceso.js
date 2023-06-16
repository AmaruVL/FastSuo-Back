const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class menu_acceso extends Model {
    static associate(models) {
      //  define association here
      // TODO: Eliminar relacion belongsToMany
      menu_acceso.belongsToMany(models.perfil, {
        through: models.lista_menu,
        foreignKey: 'menu_codigo',
        otherKey: 'perfil_codigo',
      });
    }
  }
  menu_acceso.init(
    {
      menu_codigo: {
        allowNull: false,
        type: DataTypes.STRING(6),
        primaryKey: true,
      },
      menu_etiqueta: {
        allowNull: false,
        type: DataTypes.STRING(60),
        validate: {
          is: {
            args: /^[a-z\d\-_\s]+$/i, // valida texto alfanumerico con espacios
            msg: 'Campo debe contener solo letras y numeros',
          },
        },
      },
      descripcion: {
        allowNull: false,
        type: DataTypes.STRING(60),
        validate: {
          is: {
            args: /^[a-z\d\-_\s]+$/i, // valida texto alfanumerico con espacios
            msg: 'Campo debe contener solo letras y numeros',
          },
        },
      },
      nivel: {
        allowNull: false,
        type: DataTypes.SMALLINT,
        validate: {
          isInt: {
            // valida que sea numero entero
            args: true,
            msg: 'Campo debe contener solo numeros',
          },
        },
      },
      modulo: {
        type: DataTypes.STRING(20),
        validate: {
          is: {
            args: /^[a-z\d\-_\s]+$/i, // valida texto alfanumerico con espacios
            msg: 'Campo debe contener solo letras y numeros',
          },
        },
      },
      tipo_modulo: {
        type: DataTypes.STRING(20),
        validate: {
          is: {
            args: /^[a-z\d\-_\s]+$/i, // valida texto alfanumerico con espacios
            msg: 'Campo debe contener solo letras y numeros',
          },
        },
      },
      imagen: {
        type: DataTypes.STRING(60),
        validate: {
          is: {
            args: /^[a-z\d\-_./\s]+$/i, // valida texto alfanumerico con espacios
            msg: 'Campo debe contener solo letras y numeros',
          },
        },
      },
      ambito_acceso: {
        type: DataTypes.STRING(15),
        validate: {
          is: {
            args: /^[a-z\d\-_\s]+$/i, // valida texto alfanumerico con espacios
            msg: 'Campo debe contener solo letras y numeros',
          },
        },
      },
    },
    {
      sequelize,
      modelName: 'menu_acceso',
    },
  );
  return menu_acceso;
};
