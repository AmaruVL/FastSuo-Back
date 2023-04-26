const Sequelize = require("sequelize");
var PdfPrinter = require("pdfmake");
const models = require("../models");
const moment = require("moment");
const utils = require("../services/utils")
const Op = Sequelize.Op;
var filename = module.filename.split("/").slice(-1);

exports.recaudados_oficina = (req, res) => {
	var logger = req.app.get("winston");
	var redis = req.app.get("redis");
	const token = req.header("Authorization").split(" ")[1];

	utils.decodeToken(token, tokenDecodificado => {
		//OBTENER DATOS DEL USUARIO DESDE REDIS
		redis.get(tokenDecodificado.id, (err, usuario) => {
			usuario = JSON.parse(usuario);
			var oficina_codigo = req.body.oficina_codigo;
			var fecha_inicio = req.body.fecha_inicio;
			var fecha_final = req.body.fecha_final;
			
			models.sequelize
				.query(
					`select * from giros_oficina('${oficina_codigo}','','${fecha_inicio}','${fecha_final}');`, {
						type: models.sequelize.QueryTypes.SELECT
					}
				)
				.then(lista => {
					res.json(lista);
				})
			    .catch(err => {
				    logger.log("error", { ubicacion: filename, token: token, message: err.message });
                    res.status(409).send("Error");
                    console.log(err);
				});
			})
		})
};

exports.pagados_oficina = (req, res) => {
	var logger = req.app.get("winston");
	var redis = req.app.get("redis");
	const token = req.header("Authorization").split(" ")[1];

	utils.decodeToken(token, tokenDecodificado => {
		//OBTENER DATOS DEL USUARIO DESDE REDIS
		redis.get(tokenDecodificado.id, (err, usuario) => {
			usuario = JSON.parse(usuario);
			var oficina_codigo = req.body.oficina_codigo;
			var fecha_inicio = req.body.fecha_inicio;
			var fecha_final = req.body.fecha_final;
			
			models.sequelize
				.query(
					`select * from orden_pago_oficina('${oficina_codigo}','','${fecha_inicio}','${fecha_final}');`, {
						type: models.sequelize.QueryTypes.SELECT
					}
				)
				.then(lista => {
					res.json(lista);
				})
			    .catch(err => {
				    logger.log("error", { ubicacion: filename, token: token, message: err.message });
                    res.status(409).send("Error");
                    console.log(err);
				});
			})
		})
};

exports.recibidos_oficina = (req, res) => {
	var logger = req.app.get("winston");
	var redis = req.app.get("redis");
	const token = req.header("Authorization").split(" ")[1];

	utils.decodeToken(token, tokenDecodificado => {
		//OBTENER DATOS DEL USUARIO DESDE REDIS
		redis.get(tokenDecodificado.id, (err, usuario) => {
			usuario = JSON.parse(usuario);
			var oficina_codigo = req.body.oficina_codigo;
			var fecha_inicio = req.body.fecha_inicio;
			var fecha_final = req.body.fecha_final;
			
			models.sequelize
				.query(
					`select * from recibidos_oficina('${oficina_codigo}','${fecha_inicio}','${fecha_final}');`, {
						type: models.sequelize.QueryTypes.SELECT
					}
				)
				.then(lista => {
					res.json(lista);
				})
			    .catch(err => {
				    logger.log("error", { ubicacion: filename, token: token, message: err.message });
                    res.status(409).send("Error");
                    console.log(err);
				});
			})
		})
};

exports.recibos_oficinaContable = (req, res) => {
	var logger = req.app.get("winston");
	var redis = req.app.get("redis");
	const token = req.header("Authorization").split(" ")[1];

	utils.decodeToken(token, tokenDecodificado => {
		//OBTENER DATOS DEL USUARIO DESDE REDIS
		redis.get(tokenDecodificado.id, (err, usuario) => {
			usuario = JSON.parse(usuario);
			var oficina_codigo = req.body.oficina_codigo;
			var fecha_inicio = req.body.fecha_inicio;
			var fecha_final = req.body.fecha_final;
			
			models.sequelize
				.query(
					`select * from recibos_internos_OfCont('${oficina_codigo}','${fecha_inicio}','${fecha_final}');`, {
						type: models.sequelize.QueryTypes.SELECT
					}
				)
				.then(lista => {
					res.json(lista);
				})
			    .catch(err => {
				    logger.log("error", { ubicacion: filename, token: token, message: err.message });
                    res.status(409).send("Error");
                    console.log(err);
				});
			})
		})
};

exports.recibos_oficinaReal = (req, res) => {
	var logger = req.app.get("winston");
	var redis = req.app.get("redis");
	const token = req.header("Authorization").split(" ")[1];

	utils.decodeToken(token, tokenDecodificado => {
		//OBTENER DATOS DEL USUARIO DESDE REDIS
		redis.get(tokenDecodificado.id, (err, usuario) => {
			usuario = JSON.parse(usuario);
			var oficina_codigo = req.body.oficina_codigo;
			var fecha_inicio = req.body.fecha_inicio;
			var fecha_final = req.body.fecha_final;
			
			models.sequelize
				.query(
					`select * from recibos_oficina2('${oficina_codigo}','','${fecha_inicio}','${fecha_final}');`, {
						type: models.sequelize.QueryTypes.SELECT
					}
				)
				.then(lista => {
					res.json(lista);
				})
			    .catch(err => {
				    logger.log("error", { ubicacion: filename, token: token, message: err.message });
                    res.status(409).send("Error");
                    console.log(err);
				});
			})
		})
};

exports.saldos = (req, res) => {
    var logger = req.app.get("winston");
    var redis = req.app.get("redis");
    const token = req.header("Authorization").split(" ")[1];
    utils.decodeToken(token, tokenDecodificado => {
      //OBTENER DATOS DEL USUARIO DESDE REDIS
      redis.get(tokenDecodificado.id, async (err, usuario) => {
        usuario = JSON.parse(usuario);
        let fecha = req.body.fecha_fin;
        var oficina_codigo = req.body.oficina_codigo;
        models.sequelize
          .query(`select * from saldos_contables('${fecha}','${oficina_codigo}')`, {
            type: models.sequelize.QueryTypes.SELECT
          })
          .then(totales => {
            res.json(totales);
          })
          .catch(err => {
            logger.log("error", { ubicacion: filename, token: token, message: err.message });
            res.status(409).send("Error");
            console.log(err);
          });
      });
    });
};