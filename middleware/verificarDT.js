const Sequelize = require("sequelize");
const models = require("../models");
const utils = require("../services/utils")
const Op = Sequelize.Op;
var filename = module.filename.split("/").slice(-1);

exports.verificarDTtransferencia = () => {
  return (req, res, next) => {
    var logger = req.app.get("winston");
    var redis = req.app.get("redis");
    const token = req.header("Authorization").split(" ")[1];
    utils.decodeToken(token, tokenDecodificado => {
      redis.get(tokenDecodificado.id, (err, usuario) => {
        usuario = JSON.parse(usuario);
        //si no puede editar el dt se realiza la comprabacion
        if (
          (usuario.puede_editar_DT === false && req.body.tipo_giro === "Transferencia") ||
          (usuario.puede_editar_DT === false && req.body.tipo_giro === "Banco")
        ) {
          models.sequelize
            .query(
              `SELECT "tipo_comision", ` +
                `CASE "tipo_comision" ` +
                `WHEN 'PORCENTAJE' THEN ROUND((:importe * "comision" / 100),1):: DECIMAL(8, 2) ` +
                `ELSE "comision" :: DECIMAL(8, 2) ` +
                `END as "comision" ` +
                `FROM "comision" ` +
                `WHERE ("oficina_codigo" = :oficina1 OR "oficina_codigo" = :oficina2) ` +
                `AND :importe BETWEEN "monto_minimo"  AND "monto_maximo" ` +
                `GROUP BY "tipo_comision", "comision" ` +
                `ORDER BY "comision" DESC ` +
                `LIMIT 1;`,
              {
                replacements: {
                  importe: req.body.importe,
                  oficina1: req.body.oficina_codigo_destino,
                  oficina2: usuario.oficina_codigo
                },
                type: models.sequelize.QueryTypes.SELECT
              }
            )
            .then(maxComision => {
              maxComision = maxComision[0];
              if (parseFloat(maxComision.comision) === parseFloat(req.body.comision_dt)) {
                next();
              } else {
                logger.log("warn", {
                  ubicacion: filename,
                  token: token,
                  mensaje: "La comisión no corresponde al importe dado, actualice su base de datos de DT's"
                });
                res.status(401).send("La comisión no corresponde al importe dado, actualice su base de datos de DT's");
              }
            });
        } else {
          next();
        }
      });
    });
  };
};

exports.verificarDTtransferenciaCentral = () => {
  return (req, res, next) => {
    var logger = req.app.get("winston");
    var redis = req.app.get("redis");
    const token = req.header("Authorization").split(" ")[1];
    utils.decodeToken(token, tokenDecodificado => {
      redis.get(tokenDecodificado.id, (err, usuario) => {
        usuario = JSON.parse(usuario);
        //si no puede editar el dt se realiza la comprabacion
        if (
          (usuario.puede_editar_DT === false && req.body.tipo_giro === "Transferencia") ||
          (usuario.puede_editar_DT === false && req.body.tipo_giro === "Banco")
        ) {
          models.sequelize
            .query(
              `SELECT "tipo_comision", ` +
                `CASE "tipo_comision" ` +
                `WHEN 'PORCENTAJE' THEN (:importe * "comision" / 100):: DECIMAL(8, 2) ` +
                `ELSE "comision" :: DECIMAL(8, 2) ` +
                `END as "comision" ` +
                `FROM "comision" ` +
                `WHERE ("oficina_codigo" = :oficina1 OR "oficina_codigo" = :oficina2) ` +
                `AND :importe BETWEEN "monto_minimo"  AND "monto_maximo" ` +
                `GROUP BY "tipo_comision", "comision" ` +
                `ORDER BY "comision" DESC ` +
                `LIMIT 1;`,
              {
                replacements: {
                  importe: req.body.importe,
                  oficina1: req.body.oficina_codigo_destino,
                  oficina2: req.body.oficina_codigo_origen
                },
                type: models.sequelize.QueryTypes.SELECT
              }
            )
            .then(maxComision => {
              maxComision = maxComision[0];
              if (parseFloat(maxComision.comision) === parseFloat(req.body.comision_dt)) {
                next();
              } else {
                logger.log("warn", {
                  ubicacion: filename,
                  token: token,
                  mensaje: "La comisión no corresponde al importe dado, actualice su base de datos de DT's"
                });
                res.status(401).send("La comisión no corresponde al importe dado, actualice su base de datos de DT's");
              }
            });
        } else {
          next();
        }
      });
    });
  };
};
