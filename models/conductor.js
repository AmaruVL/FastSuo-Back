const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class conductor extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      conductor.belongsTo(models.persona, { foreignKey: 'dni' });
    }
  }
  conductor.init(
    {
      nro_brevete: {
        primaryKey: true,
        type: DataTypes.STRING,
      },
      nro_licencia_correlativo: DataTypes.STRING,
      estado: DataTypes.STRING,
      fecha_expedicion: DataTypes.DATE,
      fecha_revalidacion: DataTypes.DATE,
      restricciones: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'conductor',
    },
  );
  return conductor;
};
