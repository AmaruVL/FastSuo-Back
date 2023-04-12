const models = require("../models");
import utils from "../services/utils";
var filename = module.filename.split("/").slice(-1);

exports.verificarCajaDestino = () => {
    return (req, res, next) => {
      var logger = req.app.get("winston");
      const token = req.header("Authorization").split(" ")[1];
      models.caja
        .findOne({
          where: {
            caja_codigo: req.body.destino_caja_codigo
          },
          include: [
            {
              attributes: ["estado_registro"],
              model: models.oficina,
              required: false
            }
          ]
        })
        .then(caja => {
          if (caja.estado_registro && caja.oficina.estado_registro) {
            next();
          } else if (!caja.estado_registro) {
            logger.log("warn", { ubicacion: filename, token: token, message: "Caja se encuentra desactivada." });
            res.status(401).send("Caja se encuentra desactivada.");
          } else {
            logger.log("warn", { ubicacion: filename, token: token, message: "Oficina destino ya no trabaja. Contacte con central" });
            res.status(401).send("Oficina destino ya no trabaja. Contacte con central");
          }
        })
        .catch(err => {
          logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
          res.status(401).send("Error en caja");
        });
    };
  };