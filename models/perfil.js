const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class perfil extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      perfil.hasMany(models.cuenta_usuario, { foreignKey: 'perfil_codigo' });
      perfil.belongsToMany(models.menu_acceso, {
        through: models.lista_menu,
        as: 'ListaMenu',
        foreignKey: 'perfil_codigo',
        otherKey: 'menu_codigo',
      });
      perfil.hasMany(models.lista_menu, {
        foreignKey: 'perfil_codigo',
      });
    }
  }
  perfil.init(
    {
      perfil_codigo: {
        allowNull: false,
        type: DataTypes.SMALLINT,
        primaryKey: true,
      },
      perfil_nombre: {
        type: DataTypes.STRING(100),
        validate: {
          is: {
            args: /^[a-z\d\-_.ñÑáéíóúÁÉÍÓÚ\s]+|$/i, // valida texto alfanumerico con espacios
            msg: 'Campo debe contener solo letras y numeros',
          },
        },
      },
      descripcion: {
        type: DataTypes.STRING(200),
        validate: {
          is: {
            args: /^[a-z\d\-_.ñÑáéíóúÁÉÍÓÚ\s]+|$/i, // valida texto alfanumerico con espacios
            msg: 'Campo debe contener solo letras y numeros',
          },
        },
      },
      icono: {
        type: DataTypes.STRING(20),
      },
      estado_registro: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: 'perfil',
    },
  );
  return perfil;
};
