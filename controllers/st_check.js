const Sequelize = require("sequelize");
const models = require("../models");
var filename = module.filename.split("/").slice(-1);

exports.crear = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.st_check
    .create({
      St_documento_codigo: req.body.St_documento_codigo,
      St_documento_serie: req.body.St_documento_serie,
      nro_solicitud: req.body.nro_solicitud,
      check: req.body.check,
      dt_origen: req.body.dt_origen,
      dt_origen_comision: req.body.dt_origen_comision,
      dt_destino: req.body.dt_destino,
      dt_destino_comision: req.body.dt_destino_comision,
      usuario_check: req.body.usuario_check,
      check_fecha_hora: req.body.check_fecha_hora
    })
    .then(objeto => {
      res.json({
        mensaje: objeto
      });
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message : err.message });
      res.json({
        error: err.errors
      });
    });
};

exports.buscar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.st_check
    .findOne({
      where: {
        St_documento_codigo: req.params.St_documento_codigo,
        St_documento_serie: req.params.St_documento_serie,
        nro_solicitud: req.params.nro_solicitud
      }
    })
    .then(objeto => {
      res.json(objeto);
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message : err.message });
      res.json({
        error: err.errors
      });
    });
};

exports.actualizar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.st_check
    .update(
      {
        check: req.body.check,
        dt_origen: req.body.dt_origen,
        dt_origen_comision: req.body.dt_origen_comision,
        dt_destino: req.body.dt_destino,
        dt_destino_comision: req.body.dt_destino_comision,
        usuario_check: req.body.usuario_check,
        check_fecha_hora: req.body.check_fecha_hora
      },
      {
        where: {
          St_documento_codigo: req.params.St_documento_codigo,
          St_documento_serie: req.params.St_documento_serie,
          nro_solicitud: req.params.nro_solicitud
        }
      }
    )
    .then(filasAfectadas => {
      res.json({
        mensaje: filasAfectadas
      });
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message : err.message });
      res.json({
        error: err.errors
      });
    });
};

exports.listar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.st_check
    .findAll({})
    .then(lista => {
      res.json(lista);
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message : err.message });
      res.json({
        error: err.errors
      });
    });
};

exports.listarPor = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.st_check
    .findAll({
      where: {
        usuario_check: req.params.usuario || req.query.usuario_check
      }
    })
    .then(lista => {
      res.json(lista);
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message : err.message });
      res.json({
        error: err.errors
      });
    });
};

exports.eliminar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.st_check
    .destroy({
      where: {
        St_documento_codigo: req.params.St_documento_codigo,
        St_documento_serie: req.params.St_documento_serie,
        nro_solicitud: req.params.nro_solicitud
      }
    })
    .then(respuesta => {
      res.json({
        mensaje: respuesta
      });
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message : err.message });
      res.json({
        error: err.errors
      });
    });
};
