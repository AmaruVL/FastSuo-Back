const jwt = require("jsonwebtoken");
const key = require("../config/key");
const models = require("../models");
var filename = module.filename.split("/").slice(-1);

//VERIFICAR SI SE ENCUENTRA LOGUEADO
const loggin = () => {
  return (req, res, next) => {
    try {
      var logger = req.app.get("winston");
      var redis = req.app.get("redis");
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, key.tokenKey, function(err, tokenDecodificado) {
        if (tokenDecodificado) {
          const caja_codigo = tokenDecodificado.idc;
          let usuario_codigo = tokenDecodificado.id;

          redis.get(caja_codigo, function(err, caja) {
            redis.get(usuario_codigo, function(err, usuario) {
              caja = JSON.parse(caja);
              usuario = JSON.parse(usuario);
              if (caja && usuario) {
                if (caja.estado_caja === "ABIERTO") {
                  if (usuario.estado_registro) {
                    next();
                  } else {
                    logger.log("warn", { ubicacion: filename, token: token, message: "Su usuario se encuentra inactivo" });
                    res.status(403).send("Su usuario se encuentra inactivo");
                  }
                } else {
                  logger.log("warn", { ubicacion: filename, token: token, message: "Error en caja, la caja se encuentra cerrada" });
                  res.status(403).send("Error en caja, la caja se encuentra cerrada");
                }
              } else {
                logger.log("warn", { ubicacion: filename, token: token, message: "Error en caja, vuelva a iniciar sesion" });
                res.status(403).send("Error en caja, vuelva a iniciar sesion");
              }
            });
          });
        } else if (err) {
          logger.log("warn", { ubicacion: filename, token: token, message: "token invalido" });
          res.status(403).send("token invalido");
        }
      });
    } catch (e) {
      logger.log("error", { ubicacion: filename, e });
      res.status(403).send("falta token");
    }
  };
};

module.exports = loggin;
