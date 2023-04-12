import utils from "../services/utils";
const moment = require("moment");
var filename = module.filename.split("/").slice(-1);

const cajaAbierta = () => {
  return (req, res, next) => {
    var logger = req.app.get("winston");
    var redis = req.app.get("redis");
    const token = req.header("Authorization").split(" ")[1];
    utils.decodeToken(token, tokenDecodificado => {
      redis.get(tokenDecodificado.idc, (err, caja) => {
        caja = JSON.parse(caja);
        if (caja.estado_caja === "ABIERTO") {
          if (
            caja.fecha_trabajo ===
            moment()
              .format("YYYY-MM-DD")
              .toString()
          ) {
            next();
          } else {
            const mensaje =
              "La caja del dia " +
              moment(caja.fecha_trabajo)
                .locale("es")
                .format("LLLL") +
              " no se encuentra cerrada.";
            logger.log("warn", { ubicacion: filename, token: token, message: mensaje });
            res.status(403).send(mensaje);
          }
        } else {
          logger.log("warn", { ubicacion: filename, token: token, message: "La caja se encuentra cerrada" });
          res.status(403).send("La caja se encuentra cerrada");
        }
      });
    });
  };
};

module.exports = cajaAbierta;
