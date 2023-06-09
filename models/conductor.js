const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class conductor extends Model {
    static associate(models) {
      conductor.belongsTo(models.persona, {
        foreignKey: 'id_persona',
        target: 'id_persona',
      });
    }
  }
  conductor.init(
    {
      nro_brevete: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.STRING(10),
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
