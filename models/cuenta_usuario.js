const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class cuenta_usuario extends Model {
    static associate(models) {
      cuenta_usuario.hasMany(models.tipo_conexion, {
        foreignKey: 'id_cuenta_usuario',
        sourceKey: 'usuario',
      });
      cuenta_usuario.belongsTo(models.perfil, {
        foreignKey: 'perfil_codigo',
        target: 'perfil_codigo',
      });
    }
  }
  cuenta_usuario.init(
    {
      usuario: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.STRING(20),
      },
      contrasena: {
        type: DataTypes.STRING(128),
      },
      usuario_nombre: {
        type: DataTypes.STRING(45),
      },
      pregunta_secreta: {
        type: DataTypes.STRING(60),
      },
      respuesta: {
        type: DataTypes.STRING(60),
      },
      contrasena_old: {
        type: DataTypes.STRING(128),
      },
      pc_sn: {
        type: DataTypes.STRING(50),
      },
      estado_registro: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      puede_editar_DT: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      modo_conexion: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      tipo_arqueo: {
        type: DataTypes.STRING(30),
      },
    },
    {
      sequelize,
      modelName: 'cuenta_usuario',
    },
  );
  return cuenta_usuario;
};
