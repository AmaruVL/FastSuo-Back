const Sequelize = require("sequelize");
var PdfPrinter = require("pdfmake");
import utils from "../services/utils";
const models = require("../models");
const moment = require("moment");
const Op = Sequelize.Op;
var filename = module.filename.split("/").slice(-1);

exports.gerencial_origen = async (req, res) => {
    var logger = req.app.get("winston");
    const token = req.header("Authorization").split(" ")[1];
    const opcion_entidad = req.body.opcion_entidad;
    const ordenar_por = req.body.ordenar_por;
    const entidad_codigo = req.body.entidad_codigo;
    const estado = req.body.estado;
    const fechai = req.body.fecha_inicio;
    const fechaf = req.body.fecha_final;
  
    models.sequelize
      .query(`SELECT * from reporte_gerencial_origen2('${opcion_entidad}','${ordenar_por}','${entidad_codigo}','${estado}','${fechai}','${fechaf}')`, {
        type: models.sequelize.QueryTypes.SELECT
      })
      .then(resp => {
        res.json(resp);      
      })
      .catch(err => {
        logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
        res.status(409).send("Error al generar");
      });
  };

  exports.gerencial_destino = async (req, res) => {
    var logger = req.app.get("winston");
    const token = req.header("Authorization").split(" ")[1];
    const opcion_entidad = req.body.opcion_entidad;
    const ordenar_por = req.body.ordenar_por;
    const entidad_codigo = req.body.entidad_codigo;
    const estado = req.body.estado;
    const fechai = req.body.fecha_inicio;
    const fechaf = req.body.fecha_final;
  
    models.sequelize
      .query(`SELECT * from reporte_gerencial_destino2('${opcion_entidad}','${ordenar_por}','${entidad_codigo}','${estado}','${fechai}','${fechaf}')`, {
        type: models.sequelize.QueryTypes.SELECT
      })
      .then(resp => {
        res.json(resp);      
      })
      .catch(err => {
        logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
        res.status(409).send("Error al generar");
      });
  };
