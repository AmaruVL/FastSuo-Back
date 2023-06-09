const rutas = require("express").Router();

const cuenta_usuario = require("../controllers/cuenta_usuario");
const caja_trabajo = require("../controllers/caja_trabajo");
const utils = require("../controllers/utils");
const caja = require("./Menu/Caja");
const reportes = require("./Menu/Reportes");
const mantenimientos = require("./Menu/Mantenimientos");
const configuracion = require("./Menu/Configuracion");
const confController = require("../controllers/configuracion");
const cliente_proveedor = require("../controllers/cliente_proveedor");
const logBody = require("../middleware/logBody");


//OTROS
rutas.get("/logincaja/tipoarqueo", cuenta_usuario.tipoArqueo);
rutas.get("/logincaja/getsaldocaja", caja_trabajo.obtenerSaldos);

//RUTAS MENU NIVEL 1
rutas.use("/caja", caja);
rutas.use("/configuracion", configuracion);
rutas.use("/mantenimientos", mantenimientos);
rutas.use(logBody());
rutas.use("/reportes", reportes);

//DOCUMENTOS
rutas.post("/salir", utils.cerrarSesion);
rutas.post("/salirmobil", utils.cerrarSesionMobil);
rutas.get("/buscarDocumento", utils.buscarDocumento);
rutas.use("/buscarRuc/:ruc", utils.buscarRuc);
rutas.get("/tipoCambio", utils.tipoCambio);
rutas.get("/actualizarconfiguracion", confController.listarConf);
rutas.get("/actualizarclientes", cliente_proveedor.listarMin);

//RUTAS DIRECTAS

rutas.get("/", (req, res) => {
  res.status(200).json({
    fatsuo: "FATSUO V3.1"
  });
});

module.exports = rutas;
