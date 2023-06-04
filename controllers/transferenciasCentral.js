const Sequelize = require("sequelize");
const models = require("../models");
const utils = require("../services/utils");
// import oficina from "../controllers/oficina";
// const fs = require("fs");
const moment = require("moment");
const Op = Sequelize.Op;
var filename = module.filename.split("/").slice(-1);

//////////////////////////////////////////////////////////////
//             GUARDAR IMAGENES EN UNA CARPETA              //
//////////////////////////////////////////////////////////////
const mkdirp = require("mkdirp");
var multer = require("multer");
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const dir = "imagenesComprobantes";
    mkdirp(dir, err => cb(err, dir));
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  }
});
var upload = multer({ storage: storage }).single("imagen");
//////////////////////////////////////////////////////////////
//                                                          //
//////////////////////////////////////////////////////////////
//NUEVA TRANSFERENCIA DESDE CENTRAL

//////////////////////////////////////////////////

exports.listarTransferenciasCaja = (req, res) => {
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, (err, usuario) => {
      usuario = JSON.parse(usuario);
      //OBTENER DATOS DE CAJA DESDE REDIS
      models.sequelize
        .query(`select * from buscar_operaciones_central(:cajacodigo, :fechaTrabajo);`, {
          replacements: {
            cajacodigo: tokenDecodificado.idc,
            fechaTrabajo: moment().format("YYYY-MM-DD")
          },
          type: models.sequelize.QueryTypes.SELECT
        })
        .then(operaciones => {
          res.json(operaciones);
        })
        .catch(err => {
          logger.log("error", {
            ubicacion: filename,
            token: token,
            message: { mensaje: err.message, tracestack: err.stack }
          });
          res.status(409).send("Error al listar");
        });
    });
  });
};


function calcularMaxDT(cod_oficinaA, cod_oficinaB, importe) {
  return new Promise((resolve, reject) => {
    models.sequelize
      .query(
        `SELECT max("comision") as "comision", "tipo_comision" ` +
          `FROM "comision" ` +
          `WHERE ("oficina_codigo" = :oficina2 OR "oficina_codigo" = :oficina1) ` +
          `AND :importe BETWEEN "monto_minimo"  AND "monto_maximo" ` +
          `GROUP BY "tipo_comision" ` +
          `ORDER BY "comision" DESC ` +
          `LIMIT 1;`,
        {
          replacements: {
            importe: importe,
            oficina1: cod_oficinaA,
            oficina2: cod_oficinaB
          },
          type: models.sequelize.QueryTypes.SELECT
        }
      )
      .then(maxComision => {
        maxComision = maxComision[0];
        if (maxComision.tipo_comision == "PORCENTAJE") {
          resolve(Math.round((parseFloat(maxComision.comision) / 100) * importe * 10) / 10);
        } else {
          resolve(parseFloat(maxComision.comision));
        }
      });
  });
}

function getCajaRedis(redis, caja_codigo, usuario_codigo) {
  return new Promise(async (resolve, reject) => {
    let cajaRedis = await redis.getAsync(caja_codigo);
    if (cajaRedis === null) {
      buscarCajaAbrir(redis, caja_codigo, usuario_codigo)
        .then(caja => {
          resolve(caja);
        })
        .catch(err => {
          reject(err);
        });
    } else {
      cajaRedis = JSON.parse(cajaRedis);
      if (cajaRedis.fecha_trabajo === moment().format("YYYY-MM-DD")) {
        if (cajaRedis.estado_caja === "CERRADO") {
          reject(Error("LA CAJA DE LA OFICINA ORIGEN SE ENCUENTRA CERRADA EL DIA DE HOY"));
        } else {
          resolve(cajaRedis);
        }
      } else {
        buscarCajaAbrir(redis, caja_codigo, usuario_codigo)
          .then(cajared => {
            resolve(cajared);
          })
          .catch(err => {
            reject(err);
          });
      }
    }
  });
}

function buscarCajaAbrir(redis, caja_codigo, usuario_codigo) {
  return new Promise(async (resolve, reject) => {
    const cajaTrabajo = await models.caja_trabajo.findOne({
      where: {
        fecha_trabajo: Date.now(),
        caja_codigo: caja_codigo
      }
    });
    if (cajaTrabajo) {
      redis.set(
        caja_codigo,
        JSON.stringify({
          fecha_trabajo: cajaTrabajo.fecha_trabajo,
          usuario_apertura: cajaTrabajo.usuario_apertura,
          estado_caja: cajaTrabajo.estado_caja
        })
      );
      if (cajaTrabajo.estado_caja === "ABIERTO") {
        resolve({
          fecha_trabajo: cajaTrabajo.fecha_trabajo,
          usuario_apertura: cajaTrabajo.usuario_apertura,
          estado_caja: cajaTrabajo.estado_caja
        });
      } else {
        reject(Error("LA CAJA DE LA OFICINA ORIGEN SE ENCUENTRA CERRADA EL DIA DE HOY"));
      }
    } else {
      let cajaAnterior = await models.caja_trabajo.findOne({
        order: [["fecha_trabajo", "DESC"]],
        where: {
          caja_codigo: caja_codigo
        }
      });
      if (cajaAnterior) {
        //SI EXISTE CAJA DEL DIA ANTERIOR
        if (cajaAnterior.estado_caja === "CERRADO") {
          //si esta cerrada la caja del dia anterior, abrir caja
          //const caja_trabajo = await abrirCaja(redis, caja_codigo, usuario_codigo);
          reject(Error("Primero debe abrir caja"));
          resolve(caja_trabajo);
        } else {
          //SI LA CAJA DEL DIA ANTERIOR ESTA ABIERTA
          const mensaje =
            "La caja de la oficina origen del dia " +
            moment(cajaAnterior.fecha_trabajo)
              .locale("es")
              .format("LLLL") +
            ", se encuentra abierta.";
          reject(Error(mensaje));
        }
      } else {
        //SI NO EXISTE NINGUNA CAJA PARA ESA OFICINA, ABRIR CAJA
        const caja_trabajo = await abrirCaja(redis, caja_codigo, usuario_codigo);
        resolve(caja_trabajo);
      }
    }
  });
}

function abrirCaja(redis, caja_codigo, usuario_codigo) {
  return new Promise((resolve, reject) => {
    models.caja_trabajo
      .create({
        fecha_trabajo: Date.now(),
        caja_codigo: caja_codigo,
        usuario_apertura: usuario_codigo,
        fecha_hora_apertura: Date.now(),
        estado_caja: "ABIERTO"
      })
      .then(respuesta => {
        redis.set(
          caja_codigo,
          JSON.stringify({
            fecha_trabajo: respuesta.fecha_trabajo,
            usuario_apertura: respuesta.usuario_apertura,
            estado_caja: respuesta.estado_caja
          })
        );
        resolve({
          fecha_trabajo: respuesta.fecha_trabajo,
          usuario_apertura: respuesta.usuario_apertura,
          estado_caja: respuesta.estado_caja
        });
      })
      .catch(err => {
        reject(err);
      });
  });
}

