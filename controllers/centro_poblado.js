const Sequelize = require("sequelize");
const models = require("../models");
var filename = module.filename.split("/").slice(-1);

exports.crear = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.centro_poblado
    .create({
      nombre_centro_poblado: req.body.nombre_centro_poblado,
      ubicacion: req.body.ubicacion,
      extension: req.body.extension
    })
    .then(objeto => {
      res.json(objeto);
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(412).send(err);
    });
};

exports.buscar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.centro_poblado
    .findByPk(req.params.id_centro_poblado)
    .then(objeto => {
      res.json(objeto);
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(412).send(err);
    });
};

exports.actualizar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.centro_poblado
    .update(
      {
        nombre_centro_poblado: req.body.nombre_centro_poblado,
        ubicacion: req.body.ubicacion,
        extension: req.body.extension
      },
      {
        where: {
          id_centro_poblado: req.params.id_centro_poblado
        }
      }
    )
    .then(filasAfectadas => {
      res.json(filasAfectadas);
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(412).send(err);
    });
};

exports.listar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.centro_poblado
    .findAll({})
    .then(lista => {
      res.json(lista);
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(412).send(err);
    });
};

exports.eliminar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.centro_poblado
    .destroy({
      where: {
        id_centro_poblado: req.params.id_centro_poblado
      }
    })
    .then(respuesta => {
      res.json(respuesta);
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(409).send(err);
    });
};
