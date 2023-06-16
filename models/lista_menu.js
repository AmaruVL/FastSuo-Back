const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class lista_menu extends Model {
    static associate(models) {}
  }
  lista_menu.init(
    {
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
