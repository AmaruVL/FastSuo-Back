const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class vehiculo extends Model {
    static associate(models) {
      vehiculo.belongsToMany(models.persona, {
        through: 'vehiculo_propietario',
        foreignKey: 'id_persona',
        otherKey: 'id_vehiculo',
      });
    }
  }
  vehiculo.init(
    {
      id_vehiculo: {
        allowNull: false,
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
