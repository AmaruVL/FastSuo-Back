const rutas_reportes = require("express").Router();
const reporte_horas_trabajadas = require("../../../../controllers/reporte_horas_trabajadas");
const usuarios = require("../../../../controllers/cuenta_usuario");

//agregue para la ruta de obtener usuarios
//rutas_reportes.get("/activas", oficinas.listar)
rutas_reportes.get("/listar_usuarios", usuarios.listar);
//rutas_reportes.get("/giros/:id_banco/:estado/:fechai/:fechaf", reporteBanco_Afiliados.bancos);
rutas_reportes.post("/horario", reporte_horas_trabajadas.Horas_Trabajadas);
rutas_reportes.post("/horario_afi", reporte_horas_trabajadas.Horas_Trabajadas_Afiliados);
rutas_reportes.get("/listar_usuarios_Propios", reporte_horas_trabajadas.Usuarios_Oficina_Propia);
rutas_reportes.get("/listar_usuarios_Afiliados", reporte_horas_trabajadas.Usuarios_Oficina_Afiliados);

module.exports = rutas_reportes;