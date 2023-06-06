const rutas_reportes = require("express").Router();

const cuenta_corrienteOficina = require("../../../../controllers/reporte_cuentaCorriente_oficina");

// rutas_reportes.get("/listar_oficinas", cuenta_corrienteOficina.listar_oficinas);
rutas_reportes.get("/saldos/:id_oficina", cuenta_corrienteOficina.operaciones_oficina);
rutas_reportes.get("/excel/:id_oficina", cuenta_corrienteOficina.excel_cc_of);

module.exports = rutas_reportes;