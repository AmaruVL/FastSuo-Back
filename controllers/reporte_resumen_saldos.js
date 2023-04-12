const Sequelize = require("sequelize");
var PdfPrinter = require("pdfmake");
const models = require("../models");
const moment = require("moment");
import utils from "../services/utils";
const Op = Sequelize.Op;
var filename = module.filename.split("/").slice(-1);

exports.resumen_saldos_caja = (req, res) => {
	var logger = req.app.get("winston");
	var redis = req.app.get("redis");	
	const token = req.header("Authorization").split(" ")[1];
	utils.decodeToken(token, tokenDecodificado => {
		//OBTENER DATOS DEL USUARIO DESDE REDIS
		redis.get(tokenDecodificado.id, async(err, usuario) => {
			usuario = JSON.parse(usuario);

			models.sequelize
			.query(
				`select * from resumen_saldos_caja()`,
			  {
				type: models.sequelize.QueryTypes.SELECT
			  }
			)
			.then(totales => {
			  res.json(totales);
			})
			.catch(err => {
			  logger.log("error", { ubicacion: filename, token: token, message : err.message });
			  res.status(409).send("Error");
			  console.log(err)
			});
		})
	})  	
}