const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class persona extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      persona.hasOne(models.conductor);
      persona.belongsToMany(models.vehiculo, { through: 'vehiculo_propietario' });
    }
  }
  persona.init(
    {
      dni: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.STRING(12),
      },
      tipo_persona: DataTypes.STRING,
      nombres: DataTypes.STRING,
      ap_paterno: DataTypes.STRING,
      ap_materno: DataTypes.STRING,
      razon_social: DataTypes.STRING,
      sexo: DataTypes.BOOLEAN,
      fecha_nacimiento: DataTypes.DATEONLY,
      nro_fijo: DataTypes.STRING,
      nro_movil: DataTypes.STRING,
      correo: DataTypes.STRING,
      direccion: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'persona',
    },
  );
  return persona;
};
