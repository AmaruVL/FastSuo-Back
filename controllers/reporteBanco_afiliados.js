const Sequelize = require("sequelize");
var PdfPrinter = require("pdfmake");
const models = require("../models");
const moment = require("moment");
const utils = require("../services/utils")
const Op = Sequelize.Op;
var filename = module.filename.split("/").slice(-1);

exports.bancos = async (req, res) => {
    var logger = req.app.get("winston");
    var redis = req.app.get("redis");
    const token = req.header("Authorization").split(" ")[1];
    utils.decodeToken(token, tokenDecodificado => {
		//OBTENER DATOS DEL USUARIO DESDE REDIS
		redis.get(tokenDecodificado.id, (err, usuario) => {
            usuario = JSON.parse(usuario);
            const id_banco = req.params.id_banco;
            const estado = req.params.estado;
            const fechai = req.params.fechai;
            const fechaf = req.params.fechaf;
            
            models.caja.findOne({
                attributes:["oficina_codigo"],
                where: {
                    caja_codigo: usuario.caja_codigo
                }
            })
            .then(async resp => {
                models.sequelize
                .query(`SELECT * from banco_afiliados('${id_banco}','${resp.oficina_codigo}','${estado}','${fechai}','${fechaf}')`, {
                    type: models.sequelize.QueryTypes.SELECT
                })
                .then(resp => {
                    res.json(resp);      
                })
                .catch(err => {
                    logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
                    res.status(409).send("Error al generar");
                    console.log(err)
                });
            })
            .catch(err => {
                logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
                res.status(409).send("Error al generar");
                console.log(err)
            });
        })
    })
};