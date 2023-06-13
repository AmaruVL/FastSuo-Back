const sequelize = require('../config/database');
const vehiculo = require('./vehiculo');
const cliente_proveedor = require('./cliente_proveedor');

const vehiculoPropietario = sequelize.define(
  'vehiculo_propietario',
  {},
  { freezeTableName: true },
);

//  vehiculoPropietario.belongsTo(vehiculo, {
//    foreignKey: {
//      name: "id_vehiculo",
//      primaryKey: true,
//    },
//    target: "id_vehiculo",
//  });
//  vehiculoPropietario.belongsTo(cliente_proveedor, {
//    foreignKey: {
//      name: "id_cliente",
//      primaryKey: true,
//    },
//    target: "id_cliente",
//  });

module.exports = vehiculoPropietario;
