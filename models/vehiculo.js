const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class vehiculo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      vehiculo.belongsToMany(models.persona, { through: 'vehiculo_propietario' });
    }
  }
  vehiculo.init(
    {
      id_vehiculo: {
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER,
      },
      placa: {
        allowNull: false,
        type: DataTypes.STRING(10),
      },
      marca: {
        type: DataTypes.STRING(10),
      },
      clase: {
        type: DataTypes.STRING(10),
      },
      modelo: {
        type: DataTypes.STRING(10),
      },
      color: {
        type: DataTypes.STRING(10),
      },
    },
    {
      sequelize,
      modelName: 'vehiculo',
    },
  );
  return vehiculo;
};
