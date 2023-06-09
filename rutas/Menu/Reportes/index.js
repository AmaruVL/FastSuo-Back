const rutas = require("express").Router();
const cuenta_contables = require("./cuentasContables");
const habilitaciones = require("./Habilitaciones");
const detallecajaoficinas = require("./DetalleCajaOficinas")
const detallecajaempresa = require("./DetalleCajaEmpresa")
const detalleproduccion = require("./DetalleProduccion");
const resumen_total_fechas = require("./Resumen_total_fechas")
const recibos_internos = require("./RecibosInternos");
const resumen_dolar = require("./ResumenDolar")
const horas_trabajadas = require("./Horas_Trabajadas")

rutas.use("/cuentascontables", cuenta_contables);

// rutas.use("/resumendiario", resDiario);;
rutas.use("/habilitacionesreporte",habilitaciones);
rutas.use("/detallecajaoficinas",detallecajaoficinas);
rutas.use("/detallecajaempresas",detallecajaempresa);
rutas.use("/resumenproduccion",detalleproduccion);


// rutas.use("/resumensaldosoficinascaja",resumen_saldos_Caja_Of)
rutas.use("/resumengiros",resumen_total_fechas);
rutas.use("/recibos_internos",recibos_internos);
rutas.use("/resumendolar",resumen_dolar);
//--agregue para mi ruta (daniel)
rutas.use("/horas_trabajadas",horas_trabajadas);

module.exports = rutas;
