const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class tipo_conexion extends Model {
    static associate(models) {
      tipo_conexion.belongsTo(models.cuenta_usuario, {
        foreignKey: 'id_cuenta_usuario',
        target: 'usuario',
      });
    }
  }
  tipo_conexion.init(
    {
      usuario: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.STRING(20),
      },
      fecha_trabajo: {
        allowNull: false,
        type: DataTypes.DATEONLY,
      },
      fecha_hora_apertura: {
        type: DataTypes.DATE,
        validate: {
          isDate: true,
        },
      },
      estado_caja: {
        type: DataTypes.STRING(10),
        validate: {
          is: {
            args: /^[a-z\d\-_\s]+$/i, // valida texto alfanumerico con espacios
            msg: 'Campo debe contener solo letras y numeros',
          },
        },
      },
      tipo_conexion_sistema_op: {
        type: DataTypes.STRING(255),
      },
      tipo_conexion_navegador: {
        type: DataTypes.STRING(255),
      },
      tipo_dispositivo: {
        type: DataTypes.STRING(250),
      },
      pc_movil_marca: {
        type: DataTypes.STRING(250),
      },
      pc_movil_modelo: {
        type: DataTypes.STRING(250),
      },
    },
    {
      sequelize,
      modelName: 'tipo_conexion',
    },
  );
  return tipo_conexion;
};
