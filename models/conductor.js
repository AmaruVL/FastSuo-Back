const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const cliente_proveedor = require("./cliente_proveedor");

const conductor = sequelize.define(
  "conductor",
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
    frezzTableName: true,
  },
);

// conductor.belongsTo(cliente_proveedor, {
//   foreignKey: "id_conductor",
//   target: "id_cliente",
// });

module.exports = conductor;
