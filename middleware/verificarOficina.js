const models = require("../models");
import utils from "../services/utils";
var filename = module.filename.split("/").slice(-1);

exports.verificarOfOrigen = () => {
  return (req, res, next) => {
    var logger = req.app.get("winston");
    var redis = req.app.get("redis");
    const token = req.header("Authorization").split(" ")[1];
    utils.decodeToken(token, tokenDecodificado => {
      redis.get(tokenDecodificado.id, (err, usuario) => {
        usuario = JSON.parse(usuario);
        redis.get(tokenDecodificado.idc, (err, caja) => {
          caja = JSON.parse(caja);
          if (caja.estado_caja !== "ABIERTO") {
            res.status(403).send("Caja cerrada");
          } else {
            models.oficina
              .findOne({
                where: {
                  oficina_codigo: usuario.oficina_codigo
                },
                include: [
                  {
                    attributes: ["estado_registro"],
                    model: models.empresa,
                    required: false
                  }
                ]
              })
              .then(oficina => {
                if (oficina.estado_registro && oficina.empresa.estado_registro) {
                  next();
                } else {
                  logger.log("warn", { ubicacion: filename, token: token, message: "Su oficina se encuentra desactivada" });
                  res.status(401).send("Su oficina se encuentra desactivada");
                }
              })
              .catch(err => {
                logger.log("warn", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
                res.status(401).send("Error en oficina");
              });
          }
        });
      });
    });
  };
};

exports.verificarOfOrigenCentral = () => {
  return (req, res, next) => {
    var logger = req.app.get("winston");
    const token = req.header("Authorization").split(" ")[1];
    models.oficina
      .findOne({
        where: {
          oficina_codigo: req.body.oficina_codigo_origen
        },
        include: [
          {
            attributes: ["estado_registro"],
            model: models.empresa,
            required: false
          }
        ]
      })
      .then(oficina => {
        if (oficina.estado_registro && oficina.empresa.estado_registro) {
          next();
        } else if (!oficina.estado_registro) {
          logger.log("warn", { ubicacion: filename, token: token, message: "Oficina origen se encuentra desactivada" });
          res.status(401).send("Oficina origen se encuentra desactivada");
        } else {
          logger.log("warn", { ubicacion: filename, token: token, message: "Oficina origen ya no trabaja" });
          res.status(401).send("Oficina origen ya no trabaja");
        }
      })
      .catch(err => {
        logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
        res.status(401).send("Error en oficina");
      });
  };
};

exports.verificarOfDestinoCentral = () => {
  return (req, res, next) => {
    var logger = req.app.get("winston");
    const token = req.header("Authorization").split(" ")[1];
    models.oficina
      .findOne({
        where: {
          oficina_codigo: req.body.oficina_codigo_destino
        },
        include: [
          {
            attributes: ["estado_registro"],
            model: models.empresa,
            required: false
          }
        ]
      })
      .then(oficina => {
        if (oficina.estado_registro && oficina.empresa.estado_registro) {
          next();
        } else if (!oficina.estado_registro) {
          logger.log("warn", { ubicacion: filename, token: token, message: "Oficina destino se encuentra desactivada" });
          res.status(401).send("Oficina destino se encuentra desactivada");
        } else {
          logger.log("warn", { ubicacion: filename, token: token, message: "Oficina destino ya no trabaja" });
          res.status(401).send("Oficina destino ya no trabaja");
        }
      })
      .catch(err => {
        logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
        res.status(401).send("Error en oficina");
      });
  };
};

exports.verificarOfDestino = () => {
  return (req, res, next) => {
    var logger = req.app.get("winston");
    const token = req.header("Authorization").split(" ")[1];
    models.oficina
      .findOne({
        where: {
          oficina_codigo: req.body.oficina_codigo_destino
        },
        include: [
          {
            attributes: ["estado_registro"],
            model: models.empresa,
            required: false
          }
        ]
      })
      .then(oficina => {
        if (oficina.estado_registro && oficina.empresa.estado_registro) {
          next();
        } else if (!oficina.estado_registro) {
          logger.log("warn", { ubicacion: filename, token: token, message: "Oficina destino se encuentra desactivada." });
          res.status(401).send("Oficina destino se encuentra desactivada.");
        } else {
          logger.log("warn", { ubicacion: filename, token: token, message: "Oficina destino ya no trabaja. Contacte con central" });
          res.status(401).send("Oficina destino ya no trabaja. Contacte con central");
        }
      })
      .catch(err => {
        logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
        res.status(401).send("Error en oficina");
      });
  };
};
