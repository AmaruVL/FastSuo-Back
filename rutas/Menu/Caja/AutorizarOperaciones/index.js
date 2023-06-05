// const rutas_trasferencias = require("express").Router();
// const habilitacion = require("../../../../controllers/habilitacion");

// const oficina = require("../../../../controllers/oficina");
// //NIVEL >=3
// const verificarPerfil = require("../../../../middleware/verificarPerfil");

// rutas_trasferencias.use(verificarPerfil(1));
// rutas_trasferencias.get("/oficina/listar/activas", oficina.listarOficinasActivas);
// rutas_trasferencias.get(
//   "/habilitaciones/listar/:fechaInicio/:fechaFin/:oficina_origen/:oficina_destino/:estado/:tipo",
//   habilitacion.listarHabilitacionesCentral
// );

// rutas_trasferencias.use(verificarPerfil(4));
// rutas_trasferencias.use(verificarPerfil(5));
// rutas_trasferencias.post("/habilitacion/autorizar", habilitacion.autorizarAnulacion);
// rutas_trasferencias.post("/habilitacion/anular", habilitacion.anularCentral);
// rutas_trasferencias.post("/amortizacion/anular", habilitacion.anularAmortizacionCentral);

// module.exports = rutas_trasferencias;
