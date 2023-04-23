const models = require("../models");
const utils = require("../services/utils")
var filename = module.filename.split("/").slice(-1);

exports.resumen_dolar = (req,res) =>{
    var logger = req.app.get("winston");
    var redis = req.app.get("redis");
    const token = req.header("Authorization").split(" ")[1];
    utils.decodeToken(token,tokenDecodificado => {
        //OBTENER DATOS DEL USUARIO DESDE REDIS
		redis.get(tokenDecodificado.id, async(err, usuario) => {
            usuario = JSON.parse(usuario);
            var oficina_codigo=req.params.oficina_codigo;
            models.sequelize.query(
                `select oficina_origen_codigo,concepto,avg(tipo_cambio):: numeric(7,3) as tipo_cambio from operacion_caja `+ 
                `where documento_codigo='TC-' and oficina_origen_codigo=:oficina_codigo `+
                `group by oficina_origen_codigo,concepto order by oficina_origen_codigo,concepto`,
                {	
                    replacements: {
                        oficina_codigo: oficina_codigo
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

exports.listarPor = (req,res) =>{
    var logger = req.app.get("winston");
    var redis = req.app.get("redis");
    const token = req.header("Authorization").split(" ")[1];
    utils.decodeToken(token,tokenDecodificado => {
        //OBTENER DATOS DEL USUARIO DESDE REDIS
		redis.get(tokenDecodificado.id, async(err, usuario) => {
            usuario = JSON.parse(usuario);
            models.sequelize.query(
                `select operacion_caja.oficina_origen_codigo,oficina.oficina_nombre from operacion_caja `+
                `inner join oficina on oficina.oficina_codigo=operacion_caja.oficina_origen_codigo `+
                `where documento_codigo='TC-' group by operacion_caja.oficina_origen_codigo,oficina.oficina_nombre`,
                {	
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
