const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class persona extends Model {
    static associate(models) {
      persona.hasOne(models.conductor, {
        foreignKey: 'id_persona',
        sourceKey: 'id_persona',
      });
      persona.belongsToMany(models.vehiculo, {
        through: 'vehiculo_propietario',
        foreignKey: 'id_persona',
        otherKey: 'id_vehiculo',
      });
    }
  }
  persona.init(
    {
      id_persona: {
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
        type: DataTypes.INTEGER,
      },
      tipo_persona: {
        type: DataTypes.STRING(9),
      },
      nombres: {
        type: DataTypes.STRING(35),
      },
      ap_paterno: {
        type: DataTypes.STRING(30),
      },
      ap_materno: {
        type: DataTypes.STRING(30),
      },
      razon_social: {
        type: DataTypes.STRING(100),
      },
      sexo: {
        type: DataTypes.BOOLEAN,
      },
      fecha_nacimiento: {
        type: DataTypes.DATEONLY,
      },
      nro_fijo: {
        type: DataTypes.STRING(12),
      },
      nro_movil: {
        type: DataTypes.STRING(12),
      },
      correo: {
        type: DataTypes.STRING(40),
      },
      direccion: {
        type: DataTypes.STRING(50),
      },
    },
    {
      sequelize,
      modelName: 'persona',
    },
  );
  return persona;
};
