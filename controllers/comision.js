const Sequelize = require("sequelize");
const models = require("../models");
var filename = module.filename.split("/").slice(-1);

exports.crear = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.comision
    .create({
      oficina_codigo: req.body.oficina_codigo,
      monto_minimo: req.body.monto_minimo,
      monto_maximo: req.body.monto_maximo,
      comision: req.body.comision,
      tipo_comision: req.body.tipo_comision
    })
    .then(objeto => {
      res.json(objeto);
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(409).send("No se puede guardar");
    });
};

exports.nuevoRango = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.oficina
    .findAll()
    .then(oficinas => {
      let arr = [];
      oficinas.forEach(oficina => {
        arr.push({
          oficina_codigo: oficina.oficina_codigo,
          monto_minimo: req.body.monto_minimo,
          monto_maximo: req.body.monto_maximo,
          comision: 0,
          tipo_comision: "NUMERO"
        });
      });

      models.comision
        .bulkCreate(arr, {
          returning: true
        })
        .then(resp => {
          res.json(resp);
        })
        .catch(err => {
          logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
          res.status(409).send(err);
        });
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(409).send(err);
    });
};

exports.actualizarRango = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.comision
    .update(
      {
        monto_minimo: req.body.monto_minimo,
        monto_maximo: req.body.monto_maximo
      },
      {
        where: {
          monto_minimo: req.body.monto_minimo_antiguo,
          monto_maximo: req.body.monto_maximo_antiguo
        }
      }
    )
    .then(resp => {
      res.json(resp);
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(409).send(err);
    });
};

exports.listarMinMax = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.comision
    .findAll({
      attributes: ["monto_minimo", "monto_maximo"],
      group: ["monto_minimo", "monto_maximo"],
      order: [["monto_minimo", "ASC"]]
    })
    .then(respuesta => {
      res.json(respuesta);
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(409).send(err);
    });
};

exports.asignarOficinas = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  const listaComisiones = req.body.comisiones;
  var listaComisionesXActualizar = listaComisiones.map(function(comision) {
    return models.comision.update(
      {
        comision: comision.comision,
        tipo_comision: comision.tipo_comision
      },
      {
        where: {
          oficina_codigo: comision.oficina_codigo,
          monto_minimo: comision.monto_minimo,
          monto_maximo: comision.monto_maximo
        }
      }
    );
  });

  Promise.all(listaComisionesXActualizar)
    .then(resp => {
      res.json("Actualizado correctamente");
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(409).send(err);
    });
};

exports.buscar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.comision
    .findAll({
      where: {
        oficina_codigo: req.params.oficina_codigo
      }
    })
    .then(objeto => {
      if (objeto) {
        res.json(objeto);
      } else {
        logger.log("warn", { ubicacion: filename, token: token, message: "Oficina no cuenta con una comision" });
        res.status(412).send("Oficina no cuenta con una comision");
      }
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.json({
        error: err.errors
      });
    });
};

exports.listar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.oficina
    .findAll({
      attributes: ["oficina_codigo", "oficina_nombre"],

      include: [
        {
          attributes: ["monto_minimo", "monto_maximo", "comision", "tipo_comision"],
          model: models.comision,
          as: "comisiones",
          required: true
        }
      ],
      order: [
        ["comisiones", "monto_minimo", "ASC"],
        ["oficina_codigo", "ASC"]
      ]
    })
    .then(objeto => {
      if (objeto) {
        res.json(objeto);
      } else {
        logger.log("warn", { ubicacion: filename, token: token, message: "Oficina no cuenta con una comision" });
        res.status(412).send("Oficina no cuenta con una comision");
      }
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.json({
        error: err.errors
      });
    });
};

exports.actualizar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.comision
    .update(
      {
        monto_minimo: req.body.monto_minimo,
        monto_maximo: req.body.monto_maximo,
        comision: req.body.comision,
        tipo_comision: req.body.tipo_comision
      },
      {
        where: {
          oficina_codigo: req.params.oficina_codigo
        }
      }
    )
    .then(filasAfectadas => {
      res.json(filasAfectadas);
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(409).send("No se puede actualizar");
    });
};

exports.eliminar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.comision
    .destroy({
      where: {
        oficina_codigo: req.params.oficina_codigo
      }
    })
    .then(respuesta => {
      res.json({
        mensaje: respuesta
      });
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.json({
        error: err.errors
      });
    });
};

exports.eliminarRango = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.comision
    .destroy({
      where: {
        monto_minimo: req.body.monto_minimo,
        monto_maximo: req.body.monto_maximo
      }
    })
    .then(respuesta => {
      res.json({
        mensaje: respuesta
      });
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.json("No se puede eliminar");
    });
};
