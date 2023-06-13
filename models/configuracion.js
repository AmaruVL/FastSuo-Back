const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class configuracion extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
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
