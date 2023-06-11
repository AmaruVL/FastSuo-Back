const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const conductor = require("./conductor");
const vehiculoPropietario = require("./vehiculo_propietario");

const cliente_proveedor = sequelize.define(
  "cliente_proveedor",
  {
    id_cliente: {
      primaryKey: true,
      allowNull: false,
      type: DataTypes.STRING(12),
    },
    cliente_tipo_persona: {
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
    freezeTableName: true,
  },
);

cliente_proveedor.removeAttribute("id");
cliente_proveedor.hasOne(conductor);
cliente_proveedor.hasMany(vehiculoPropietario);

module.exports = cliente_proveedor;
