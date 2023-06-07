const rutas_administrados = require("express").Router();
const administrados = require("../../../../controllers/cliente_proveedor");
const verificarPerfil = require("../../../../middleware/verificarPerfil");

//TODO: Agregar "verificarPerfil" a cada endpoint
// rutas_administrados.get("/listar", [verificarPerfil(1)], administrados.listar);
// rutas_administrados.get("/buscar/:id_cliente", [verificarPerfil(2)], administrados.buscar);
// rutas_administrados.get("/buscarnombre/:nombre", [verificarPerfil(2)], administrados.buscarNombre);

// rutas_administrados.post("/", [verificarPerfil(3)], administrados.crear);
// rutas_administrados.put("/actualizar/:id_cliente", [verificarPerfil(4)], administrados.actualizar);
// //rutas_clientes.put("/desactivar/:id_cliente", clientes.desactivar);
// rutas_administrados.delete("/eliminar/:id_cliente", [verificarPerfil(6)], administrados.eliminar);
rutas_administrados.get("/listar", administrados.listar);
rutas_administrados.get("/buscar/:id_administrado", administrados.buscar);
rutas_administrados.get("/buscarnombre/:nombre", administrados.buscarNombre);

rutas_administrados.post("/", administrados.crear);
rutas_administrados.put("/actualizar/:id_administrado", administrados.actualizar);
//rutas_clientes.put("/desactivar/:id_cliente", clientes.desactivar);
rutas_administrados.delete("/eliminar/:id_administrado", administrados.eliminar);

module.exports = rutas_administrados;


