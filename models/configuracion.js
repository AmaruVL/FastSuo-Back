const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class configuracion extends Model {
    static associate() {}
  }
  configuracion.init(
    {
      clave: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.STRING(50),
      },
      valor: {
        allowNull: false,
        type: DataTypes.STRING(200),
      },
    },
    {
      sequelize,
      modelName: 'configuracion',
    },
  );
  return configuracion;
};
