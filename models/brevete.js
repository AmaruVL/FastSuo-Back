const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const brevete = sequelize.define(
  "brevete",
  {
    id: {
      primaryKey: true,
      autoIncrement: true,
      type: DataTypes.INTEGER,
    },
    razon_social: {
      type: DataTypes.STRING(100),
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
    frezzTableName: true,
  },
);

module.exports = brevete;
