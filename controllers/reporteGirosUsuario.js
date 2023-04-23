const Sequelize = require("sequelize");
const models = require("../models");
const utils = require("../services/utils");
// import oficina from "../controllers/oficina";
// const moment = require("moment");
// const Op = Sequelize.Op;
// const fs = require("fs");
var filename = module.filename.split("/").slice(-1);

exports.girosUsuario = (req, res) => {
    var logger = req.app.get("winston");
    const token = req.header("Authorization").split(" ")[1];
    req.params.estado === '6' ? 
    (models.sequelize
      .query(
        ` select * from operacion_caja oc inner join recibo_interno ri ` +
            `on oc.documento_codigo=ri.recibo_doc_codigo and `+
            `oc.documento_serie=ri.recibo_doc_serie and `+
            `oc.nro_operacion=ri.recibo_nro `+
          `inner join oficina ofOr on oc.oficina_origen_codigo=ofOr.oficina_codigo `+
          `where oc.modulo='Recibo interno' and oc.usuario=:usuario and fecha_hora_operacion ` +
            `BETWEEN ((DATE(:fechaInicio) + time '00:00:00')AT TIME ZONE 'PET') `+
            `AND ((DATE(:fechaFinal) + time '23:59:59')AT TIME ZONE 'PET') order by oc.fecha_hora_operacion`,
        {
          replacements: {            
            usuario: req.params.usuario,
            fechaInicio: req.params.fechaInicio,
            fechaFinal: req.params.fechaFinal,
          },
          type: models.sequelize.QueryTypes.SELECT,
          nest: true
        }
      )
      .then(giros => {
        res.json(giros);
      })
      .catch(err => {
        console.log(err)
        logger.log("error", {
          ubicacion: filename,
          token: token,
          message: { mensaje: err.message, tracestack: err.stack }
        });
        res.status(409).send(err);
      })
    ) :
    (models.sequelize
      .query(
        `SELECT * from giros_por_usuario(:usuario,:estado,:fechaInicio,:fechaFinal)`,
        {
          replacements: {            
            usuario: req.params.usuario,
            estado: req.params.estado,
            fechaInicio: req.params.fechaInicio,
            fechaFinal: req.params.fechaFinal,
          },
          type: models.sequelize.QueryTypes.SELECT,
          nest: true
        }
      )
      .then(giros => {
        res.json(giros);
      })
      .catch(err => {
        console.log(err)
        logger.log("error", {
          ubicacion: filename,
          token: token,
          message: { mensaje: err.message, tracestack: err.stack }
        });
        res.status(409).send(err);
      })
    );     
  };
  