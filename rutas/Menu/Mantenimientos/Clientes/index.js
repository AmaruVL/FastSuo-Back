const rutas_clientes = require("express").Router();
const clientes = require("../../../../controllers/cliente_proveedor");
const verificarPerfil = require("../../../../middleware/verificarPerfil");

rutas_clientes.get("/listar", [verificarPerfil(1)], clientes.listar);
rutas_clientes.get("/buscar/:id_cliente", [verificarPerfil(2)], clientes.buscar);
rutas_clientes.get("/buscarnombre/:nombre", [verificarPerfil(2)], clientes.buscarNombre);

rutas_clientes.post("/", [verificarPerfil(3)], clientes.crear);
rutas_clientes.put("/actualizar/:id_cliente", [verificarPerfil(4)], clientes.actualizar);
//rutas_clientes.put("/desactivar/:id_cliente", clientes.desactivar);
rutas_clientes.delete("/eliminar/:id_cliente", [verificarPerfil(6)], clientes.eliminar);

module.exports = rutas_clientes;