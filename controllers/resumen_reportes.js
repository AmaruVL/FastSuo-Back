const Sequelize = require("sequelize");
var PdfPrinter = require("pdfmake");

const models = require("../models");
const moment = require("moment");
import utils from "../services/utils";
const Op = Sequelize.Op;
var filename = module.filename.split("/").slice(-1);

exports.saldo_recaudadas = (req,res) =>{
    var logger = req.app.get("winston");
    var redis = req.app.get("redis");
    const token = req.header("Authorization").split(" ")[1];
    utils.decodeToken(token,tokenDecodificado => {
        //OBTENER DATOS DEL USUARIO DESDE REDIS
		redis.get(tokenDecodificado.id, async(err, usuario) => {
            usuario = JSON.parse(usuario);
            var oficina_codigo=req.body.oficina_codigo;
            var fecha_inicio = req.body.fecha_inicio;
            var fecha_final = req.body.fecha_final;
            models.sequelize.query(
                `select sum(importe) as importe,sum(comision_dt) as dt,`+
                `sum(coalesce(gastos_administrativos,0)+coalesce(comision_banco,0)) as gastos `+
                `from public.transferencia where oficina_codigo_origen=:oficina_codigo `+
                `and solicitud_fecha_hora between ((DATE(:fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') `+ 
                `and ((DATE(:fecha_final) + time '23:59:59')AT TIME ZONE 'PET')`,
                {	
                    replacements: {
                        oficina_codigo: oficina_codigo,
                        fecha_inicio:fecha_inicio,
                        fecha_final:fecha_final
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

exports.saldo_recibidas = (req,res) =>{
    var logger = req.app.get("winston");
    var redis = req.app.get("redis");
    const token = req.header("Authorization").split(" ")[1];
    utils.decodeToken(token,tokenDecodificado => {
        //OBTENER DATOS DEL USUARIO DESDE REDIS
		redis.get(tokenDecodificado.id, async(err, usuario) => {
            usuario = JSON.parse(usuario);
            var oficina_codigo=req.body.oficina_codigo;
            var fecha_inicio = req.body.fecha_inicio;
            var fecha_final = req.body.fecha_final;
            models.sequelize.query(
                `select sum(importe) as importe,sum(comision_dt) as dt,`+
                `sum(coalesce(gastos_administrativos,0)+coalesce(comision_banco,0)) as gastos `+
                `from public.transferencia where oficina_codigo_destino=:oficina_codigo `+
                `and solicitud_fecha_hora between ((DATE(:fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') `
                `and ((DATE(:fecha_final) + time '23:59:59')AT TIME ZONE 'PET')`,
                {	
                    replacements: {
                        oficina_codigo: oficina_codigo,
                        fecha_inicio: fecha_inicio,
                        fecha_final: fecha_final
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

exports.saldo_por_pagar = (req,res) =>{
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
                `select `+	
                `CASE "Giro"."moneda"`+
                `WHEN '1' THEN coalesce(sum("Giro"."importe"),0):: DECIMAL(7, 2) `+
                `ELSE (0.00):: DECIMAL(7, 2) END AS "por_pag_soles",`+
                `CASE "Giro"."moneda"`+
                `WHEN '2' THEN coalesce(sum("Giro"."importe"),0):: DECIMAL(7, 2) `+
                `ELSE (0.00):: DECIMAL(7, 2) END AS "por_pag_dolares"`+
                `from public.operacion_caja OCaj Inner join public.transferencia as "Giro" `+
                `ON (Ocaj.documento_codigo = "Giro"."St_documento_codigo" `+
                    `and OCaj.documento_serie = "Giro"."St_documento_serie" `+
                    `and OCaj.nro_operacion = "Giro"."nro_Solicitud")`+
                `where "Giro".oficina_codigo_destino `+
                `in (select oficina_codigo from caja where caja_codigo='Z1-OF1') `+
                `and date(fecha_hora_operacion)='2019-12-10' group by "Giro"."moneda" `,
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
            });
        })
    })
}

exports.saldo_anterior_giros = (req,res) =>{
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
                `select coalesce(sum(OCaj."moneda1_Ingre"),0), coalesce(sum(OCaj."moneda2_Ingre"),0) `+ 
                `from public.operacion_caja OCaj Inner join public.transferencia as "Giro" `+
                `ON (Ocaj.documento_codigo = "Giro"."St_documento_codigo" `+
                `and OCaj.documento_serie = "Giro"."St_documento_serie" `+
                `and OCaj.nro_operacion = "Giro"."nro_Solicitud") `+
                `where caja_codigo=:caja_cod and date(fecha_hora_operacion)<:fecha`,
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