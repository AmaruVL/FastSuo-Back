const Sequelize = require("sequelize");
var PdfPrinter = require("pdfmake");
const models = require("../models");
const moment = require("moment");
const utils = require("../services/utils")
const Op = Sequelize.Op;
var filename = module.filename.split("/").slice(-1);

exports.cc_oficinas = (req, res) => {
    var logger = req.app.get("winston");
    var redis = req.app.get("redis");
    const token = req.header("Authorization").split(" ")[1];
    utils.decodeToken(token, tokenDecodificado => {
      //OBTENER DATOS DEL USUARIO DESDE REDIS
      redis.get(tokenDecodificado.id, async (err, usuario) => {
        usuario = JSON.parse(usuario);
        const cod_oficina = req.body.cod_oficina;
        const fecha_inicio = req.body.fecha_inicio;
        const fecha_fin = req.body.fecha_fin;
  
        models.sequelize
          .query(`select * from cuentas_corrientes_oficinas('${cod_oficina}','${fecha_inicio}','${fecha_fin}');`, {
            type: models.sequelize.QueryTypes.SELECT
          })
          .then(resp => {
            res.json(resp);
          })
          .catch(err => {
            logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
            res.status(409).send("Error al generar");
          });
      });
    });
  };

  exports.listar_oficinas = (req, res) => {
    var logger = req.app.get("winston");
    var redis = req.app.get("redis");
    const token = req.header("Authorization").split(" ")[1];
    utils.decodeToken(token, tokenDecodificado => {
      //OBTENER DATOS DEL USUARIO DESDE REDIS
      redis.get(tokenDecodificado.id, async (err, usuario) => {
        usuario = JSON.parse(usuario);
  
        models.sequelize.query(
          `select oficina_codigo_src,oficina.oficina_nombre from cuenta_corriente `+
          `inner join oficina on cuenta_corriente.oficina_codigo_src = oficina.oficina_codigo `+
          `where es_servicio = false group by oficina_codigo_src,oficina.oficina_nombre`,
          {
            type: models.sequelize.QueryTypes.SELECT
          }
        )
        .then(resp => {
          res.json(resp);
        })
        .catch(err => {
          logger.log("error", { ubicacion: filename, token: token, message: {mensaje: err.message, tracestack: err.stack }});
          res.status(409).send(err.message);
          console.log(err);
        })
      })
    });
  };