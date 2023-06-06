const Sequelize = require("sequelize");
var PdfPrinter = require("pdfmake");
const models = require("../models");
const moment = require("moment");
// import utils from "../services/utils";
const Op = Sequelize.Op;
var filename = module.filename.split("/").slice(-1);

exports.bancos = async (req, res) => {
    var logger = req.app.get("winston");
    const token = req.header("Authorization").split(" ")[1];
    const id_banco = req.params.id_banco;
    const oficina_origen = req.params.oficina_origen;
    const in_usuario = req.params.in_usuario;
    const opcion = req.params.opcion;
    const estado = req.params.estado;
    const tipo = req.params.tipo;
    const fechai = req.params.fechai;
    const fechaf = req.params.fechaf;
  
    models.sequelize
      .query(`SELECT * from bancosRepor('${id_banco}','${oficina_origen}','${in_usuario}', '${opcion}','${estado}','${tipo}','${fechai}','${fechaf}')`, {
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