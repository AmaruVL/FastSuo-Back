const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class lista_menu extends Model {
    static associate(models) {
      // define association here
      lista_menu.belongsTo(models.perfil, {
        foreignKey: 'perfil_codigo',
        target: 'perfil_codigo',
      });
    }
  }
  lista_menu.init(
    {
      menu_codigo: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.STRING(6),
        reference: {
          model: 'menu_acceso',
          key: 'menu_codigo',
        },
      },
      perfil_codigo: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.SMALLINT,
        reference: {
          model: 'perfil',
          key: 'perfil_codigo',
        },
      },
      nivel_acceso: {
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
    },
    {
      sequelize,
      modelName: 'lista_menu',
    },
  );
  lista_menu.removeAttribute('id');
  return lista_menu;
};
