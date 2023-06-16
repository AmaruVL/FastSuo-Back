const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class lista_menu extends Model {
    static associate(models) {
      lista_menu.belongsTo(models.perfil, {
        foreignKey: 'perfil_codigo',
        onDelete: 'CASCADE',
      });
      lista_menu.belongsTo(models.menu_acceso, { foreignKey: 'menu_codigo' });
    }
  }
  lista_menu.init(
    {
      menu_codigo: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.STRING(6),
      },
      perfil_codigo: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.SMALLINT,
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
  return lista_menu;
};
