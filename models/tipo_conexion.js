const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const tipo_conexion = sequelize.define(
  "tipo_conexion",
  {
    usuario: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.STRING(20),
      references: {
        model: "cuenta_usuario",
        key: "usuario",
      },
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
          args: /^[a-z\d\-_\s]+$/i, //valida texto alfanumerico con espacios
          msg: "Campo debe contener solo letras y numeros",
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
    freezeTableName: true,
  },
);

tipo_conexion.removeAttribute("id");
tipo_conexion.associate = function (models) {
  // associations can be defined here
  tipo_conexion.belongsTo(models.cuenta_usuario, {
    foreignKey: "usuario",
    targetKey: "usuario",
  });
};

module.exports = tipo_conexion;
