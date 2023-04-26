const Sequelize = require("sequelize");
const models = require("../models");
const utils = require("../services/utils");
// import oficina from "../controllers/oficina";
// const moment = require("moment");
// const Op = Sequelize.Op;
// const fs = require("fs");
var filename = module.filename.split("/").slice(-1);

exports.giros = (req, res) => {
    var logger = req.app.get("winston");
    const token = req.header("Authorization").split(" ")[1];
  
    models.sequelize
      .query(
        `SELECT * ` +
          `FROM rep_giros_general(` +          
          `:of_origen, ` +
          `:of_destino,` +
          `:nombre , ` +
          `:estado, ` +
          `:importei, ` +
          `:importef, ` +
          `:fechai, ` +
          `:fechaf ` +
          `)`,
        {
          replacements: {            
            of_origen: req.params.oficina_origen,
            of_destino: req.params.oficina_destino,
            nombre: req.params.query,
            estado: req.params.estado === "*" ? 0 : req.params.estado,
            importei: req.params.importei,
            importef: req.params.importef,
            fechai: req.params.fechaInicio,
            fechaf: req.params.fechaFin,
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
      });
  };
  