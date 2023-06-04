const rutas = require("express").Router();

const caja_dia = require("./CajaDia");
const central = require("./Central");
const mensualTransferencias = require("./MensualTransferencias");
const ordenesPago = require("./OrdenPago");
const resumen = require("./Resumen_Saldos");
const recaudados = require("./GirosRecaudados");
const recCaja = require("./GirosRecCaja");
const cuentaServiciosCentral = require("./CuentaServiciosCentral");
const cuentaServicios = require("./CuentaServicios");
const cuentas = require("./Cuentas");
const cuenta_contables = require("./cuentasContables");
const saldoGiros = require("./SaldosGiros");
const banco = require("./Bancos");
//-----
const resDiario = require("./ResumenDiario");
const girosGen = require("./GirosGeneral");
const habilitaciones = require("./Habilitaciones");
const gerencial = require("./Gerencial");
const cc_oficina = require("./CuentaCorrienteOficina")
const detallesaldos = require("./DetalleSaldosCont_Real")
const detallesaldoscentral = require("./DetalleSaldosCont_Real_Central")
const detallecajaoficinas = require("./DetalleCajaOficinas")
const detallecajaempresa = require("./DetalleCajaEmpresa")
const detalleproduccion = require("./DetalleProduccion");
const banco_afiliados = require("./BancoAfiliados");
const resumen_saldos_Caja_Of = require("./Resumen_Saldos_Caja")
const resumen_total_fechas = require("./Resumen_total_fechas")
const recibos_internos = require("./RecibosInternos");
const reporte_cc = require("./CCOficinas");
const resumen_cc = require("./Resumen_CC");
const resumen_dolar = require("./ResumenDolar")
const resumenmovimientos = require("./MovimientosMoneda3");
const girosUsuario = require("./GirosUsuario");
//--agregue para mi ruta (daniel)
const horas_trabajadas = require("./Horas_Trabajadas")

rutas.use("/cajadia", caja_dia);
rutas.use("/central", central);
rutas.use("/resumenmensual", mensualTransferencias);
rutas.use("/reporteops", ordenesPago);
rutas.use("/recibidoscaja", ordenesPago);
rutas.use("/resumensaldos", resumen);
rutas.use("/resumensaldos2", resumen);
rutas.use("/girosrecaudadoscentral", recaudados);
rutas.use("/girosrecaudados", recCaja);
rutas.use("/cuentaservicios", cuentaServiciosCentral);
rutas.use("/oficinacuentaservicios", cuentaServicios);
rutas.use("/cuentas", cuentas);
rutas.use("/resumensaldosgiros", saldoGiros);
rutas.use("/girosbancos", banco);
rutas.use("/cuentascontables", cuenta_contables);

//-----
rutas.use("/resumendiario", resDiario);
rutas.use("/girosgeneral", girosGen);
rutas.use("/habilitacionesreporte",habilitaciones);
rutas.use("/resumengerencial",gerencial);
rutas.use("/saldoscuentascorrientes",cc_oficina);
rutas.use("/detallesaldos",detallesaldos);
rutas.use("/detallesaldoscentral",detallesaldoscentral);

rutas.use("/detallecajaoficinas",detallecajaoficinas);
rutas.use("/detallecajaempresas",detallecajaempresa);

rutas.use("/resumenproduccion",detalleproduccion);

rutas.use("/bancos",banco_afiliados);

rutas.use("/resumensaldosoficinascaja",resumen_saldos_Caja_Of);
rutas.use("/resumengiros",resumen_total_fechas);
rutas.use("/recibos_internos",recibos_internos);

rutas.use("/cuentascorrientesoficina",reporte_cc);
rutas.use("/resumencuentascorrientes",resumen_cc);

rutas.use("/resumendolar",resumen_dolar);
rutas.use("/resumen_movimientos",resumenmovimientos);
rutas.use("/detallegirosusuarios",girosUsuario);
//--agregue para mi ruta (daniel)
rutas.use("/horas_trabajadas",horas_trabajadas);

module.exports = rutas;
