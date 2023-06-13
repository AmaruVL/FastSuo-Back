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
        type: DataTypes.INTEGER,
      },
      nro_licencia_correlativo: {
        type: DataTypes.STRING(100),
      },
      estado: {
        type: DataTypes.STRING(100),
      },
      fecha_expedicion: {
        type: DataTypes.DATE,
      },
      fecha_revalidacion: {
        type: DataTypes.DATE,
      },
      restricciones: {
        allowNull: true,
        type: DataTypes.STRING(100),
      },
    },
    {
      sequelize,
      modelName: 'conductor',
    },
  );
  return conductor;
};
