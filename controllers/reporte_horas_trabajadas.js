const Sequelize = require("sequelize");
var PdfPrinter = require("pdfmake");
const models = require("../models");
const moment = require("moment");
import utils from "../services/utils";
const Op = Sequelize.Op;
var filename = module.filename.split("/").slice(-1);

exports.Horas_Trabajadas = async (req, res) => {
    var logger = req.app.get("winston");
    var redis = req.app.get("redis");
    const token = req.header("Authorization").split(" ")[1];
    utils.decodeToken(token, tokenDecodificado =>{
        //OBTENER DATOS DEL USUARIO DESDE REDIS
        redis.get(tokenDecodificado.id, (err, usuario) => {
            usuario = JSON.parse(usuario);
			      var fecha_inicio = req.body.fecha_inicio;
            var fecha_final = req.body.fecha_final;
            var codigo = req.body.codigo;
            models.sequelize
            .query(
            `select cj.fecha_trabajo, cj.caja_codigo, ca.caja_nombre, cj.usuario_apertura, cu.usuario_nombre, cj.fecha_hora_apertura, cj.fecha_hora_cierre, cj.usuario_cierre, cj.estado_caja, cj."Saldo1",cu.caja_codigo, ofi.oficina_tipo, tc.tipo_conexion_sistema_op, tc.tipo_conexion_navegador, tc.tipo_dispositivo, tc.pc_movil_marca, tc.pc_movil_modelo
            from caja_trabajo cj inner join cuenta_usuario cu on ( cj.usuario_apertura = cu.usuario) inner join caja ca on (cj.caja_codigo = ca.caja_codigo) inner join oficina ofi on (ca.oficina_codigo  = ofi.oficina_codigo) left join tipo_conexion tc on (cj.usuario_apertura = tc.usuario and cj.fecha_trabajo = tc.fecha_trabajo)
            where cj.usuario_apertura = '${codigo}' and cj.caja_codigo LIKE 'OFP%' and date (cj.fecha_hora_apertura) BETWEEN '${fecha_inicio}' AND '${fecha_final}' 
            order by cj.fecha_trabajo asc`,
            {
            type: models.sequelize.QueryTypes.SELECT
            }
          )
          .then(horarios => {
            res.json(horarios);
          })
          .catch(err => {
            logger.log("error", { ubicacion: filename, token: token, message : err.message });
            res.status(409).send("Error");
            console.log(err)
          });
        })
    })
}

exports.Horas_Trabajadas_Afiliados = async (req, res) => {
  var logger = req.app.get("winston");
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado =>{
      //OBTENER DATOS DEL USUARIO DESDE REDIS
      redis.get(tokenDecodificado.id, (err, usuario) => {
          usuario = JSON.parse(usuario);
          var fecha_inicio = req.body.fecha_inicio;
          var fecha_final = req.body.fecha_final;
          var codigo = req.body.codigo;
          models.sequelize
          .query(
          `select cj.fecha_trabajo, cj.caja_codigo, ca.caja_nombre, cj.usuario_apertura, cu.usuario_nombre, cj.fecha_hora_apertura, cj.fecha_hora_cierre, cj.usuario_cierre, cj.estado_caja, cj."Saldo1",cu.caja_codigo, ofi.oficina_tipo, tc.tipo_conexion_sistema_op, tc.tipo_conexion_navegador, tc.tipo_dispositivo, tc.pc_movil_marca, tc.pc_movil_modelo
          from caja_trabajo cj inner join cuenta_usuario cu on ( cj.usuario_apertura = cu.usuario) inner join caja ca on (cu.caja_codigo = ca.caja_codigo) inner join oficina ofi on (ca.oficina_codigo  = ofi.oficina_codigo) left join tipo_conexion tc on (cj.fecha_trabajo = tc.fecha_trabajo)
          where cj.usuario_apertura = '${codigo}' and cj.caja_codigo = cu.caja_codigo and date (cj.fecha_hora_apertura) BETWEEN '${fecha_inicio}' AND '${fecha_final}' 
          order by cj.fecha_trabajo asc`,
          {
          type: models.sequelize.QueryTypes.SELECT
          }
        )
        .then(horarios => {
          res.json(horarios);
        })
        .catch(err => {
          logger.log("error", { ubicacion: filename, token: token, message : err.message });
          res.status(409).send("Error");
          console.log(err)
        });
      })
  })
}

exports.Usuarios_Oficina_Propia = async (req, res) => {
  var logger = req.app.get("winston");
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado =>{
      //OBTENER DATOS DEL USUARIO DESDE REDIS
      redis.get(tokenDecodificado.id, (err, usuario) => {
          usuario = JSON.parse(usuario);
          
          models.sequelize
          .query(
          `select cu.usuario, cu.contrasena, cu.usuario_nombre, cu.pregunta_secreta, cu.respuesta, cu.estado_registro, cu.perfil_codigo, cu.caja_codigo, cu."puede_editar_DT", cu.pc_sn, cu.modo_conexion, ca.caja_codigo, ca.caja_nombre, cu.tipo_arqueo, pe.perfil_nombre
          from cuenta_usuario cu inner join caja ca on (cu.caja_codigo = ca.caja_codigo) inner join perfil pe on (cu.perfil_codigo = pe.perfil_codigo) inner join oficina ofi on(ca.oficina_codigo = ofi.oficina_codigo) 
          where ofi.oficina_tipo = 'Propio' and cu.estado_registro = true`,
          {
          type: models.sequelize.QueryTypes.SELECT
          }
        )
        .then(usuarios => {
          res.json(usuarios);
        })
        .catch(err => {
          logger.log("error", { ubicacion: filename, token: token, message : err.message });
          res.status(409).send("Error");
          console.log(err)
        });
      })
  })
}

exports.Usuarios_Oficina_Afiliados = async (req, res) => {
  var logger = req.app.get("winston");
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado =>{
      //OBTENER DATOS DEL USUARIO DESDE REDIS
      redis.get(tokenDecodificado.id, (err, usuario) => {
          usuario = JSON.parse(usuario);
          
          models.sequelize
          .query(
          `select cu.usuario, cu.contrasena, cu.usuario_nombre, cu.pregunta_secreta, cu.respuesta, cu.estado_registro, cu.perfil_codigo, cu.caja_codigo, cu."puede_editar_DT", cu.pc_sn, cu.modo_conexion, ca.caja_codigo, ca.caja_nombre, cu.tipo_arqueo, pe.perfil_nombre
          from cuenta_usuario cu inner join caja ca on (cu.caja_codigo = ca.caja_codigo) inner join perfil pe on (cu.perfil_codigo = pe.perfil_codigo) inner join oficina ofi on(ca.oficina_codigo = ofi.oficina_codigo) 
          where ofi.oficina_tipo = 'Afiliado' and cu.estado_registro = true`,
          {
          type: models.sequelize.QueryTypes.SELECT
          }
        )
        .then(usuarios => {
          res.json(usuarios);
        })
        .catch(err => {
          logger.log("error", { ubicacion: filename, token: token, message : err.message });
          res.status(409).send("Error");
          console.log(err)
        });
      })
  })
}