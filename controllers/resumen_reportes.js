const Sequelize = require("sequelize");
var PdfPrinter = require("pdfmake");

const models = require("../models");
const moment = require("moment");
const utils = require("../services/utils")
const Op = Sequelize.Op;
var filename = module.filename.split("/").slice(-1);

exports.resumen = (req,res) =>{
    var logger = req.app.get("winston");
    var redis = req.app.get("redis");
    const token = req.header("Authorization").split(" ")[1];
    utils.decodeToken(token,tokenDecodificado => {
        //OBTENER DATOS DEL USUARIO DESDE REDIS
		redis.get(tokenDecodificado.id, async(err, usuario) => {
            usuario = JSON.parse(usuario);
            var caja_cod=req.body.caja_cod ? req.body.caja_cod : usuario.caja_codigo;
            var fecha = req.body.fecha;
            models.sequelize.query(
                `select * from resumen_diario(:caja_cod,:fecha)`,
                {	
                    replacements: {
                    fecha: fecha,
                    caja_cod: caja_cod
                    },
                    type: models.sequelize.QueryTypes.SELECT
                }
            )
            .then(resp => {
                res.json(resp);
            })
            .catch(err => {
                logger.log("error", { ubicacion: filename, token: token, message : err.message });
                res.status(409).send(err);
                console.log(err)
            });
        })
    })
}