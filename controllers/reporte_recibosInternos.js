const Sequelize = require("sequelize");
var PdfPrinter = require("pdfmake");
// import utils from "../services/utils";
const models = require("../models");
const moment = require("moment");
const Op = Sequelize.Op;
var filename = module.filename.split("/").slice(-1);

exports.recibos = async (req, res) => {
    var logger = req.app.get("winston");
    const token = req.header("Authorization").split(" ")[1];
    const oficina_codigo = req.body.oficina_codigo;
    const fechai = req.body.fecha_inicio;
    const fechaf = req.body.fecha_final;
  
    models.sequelize
      .query(`SELECT * from reporte_recibosInternos('${oficina_codigo}','${fechai}','${fechaf}')`, {
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