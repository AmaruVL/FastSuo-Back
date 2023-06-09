const jwt = require("jsonwebtoken");
const moment = require("moment")
const key = require("../config/key");
const models = require("../models");
const axios = require('axios');
const cache = require("../config/cache");
// import models from "../models";
// import axios from "axios";
// const config = require("../config/config");
exports.decodeToken = (token, callback) => {
  jwt.verify(token, key.tokenKey, function(err, decoded) {
    if (!err) {
      callback(decoded);
    } else {
      callback(false);
    }
  });
};

exports.transaccionDia = callback => {
  models.operacion_caja
    .count({
      where: {
        fecha_trabajo: Date.now()
      }
    })
    .then(operacion => {
      callback(operacion);
    });
};

exports.operacionDia = async () => {
  var hoy = moment().date();
  var res = await models.operacion_caja.count({
    where: {
      fecha_trabajo: Date.now()
    }
  });
  return res;
};

exports.buscarDNI = (dni, callback) => {
  axios({
    method: "get",
    baseURL: `http://localhost:6060/dni/${dni}`,
    url: ``, 
  })
  .then(response => {
    const datos = response.data;
    if (datos) {
      callback({
        dni: dni,
        nombres: datos.nombres,
        ap_paterno: datos.ap_paterno,
        ap_materno: datos.ap_materno,
        fecha_nacimiento: datos.fecha_nacimiento,
        sexo: datos.sexo,
        direccion: datos.direccion
      });
    } else {
      callback(false);
    }
  })
  .catch(err => {;
    console.log(err)
  });
};

exports.buscarRUC = (ruc, callback) => {
  axios({
    method: "get",
    baseURL: "http://localhost:6060/ruc",
    url: `/${ruc}`
  })
    .then(response => {
      const datos = response.data;
      if (datos.razon_social) {
        callback({
          razon_social: datos.razon_social,
          contribuyente_estado: "Activo",
          domicilio_fiscal: datos.domicilio_fiscal,
          representante_legal: ""
        });
      } else {
        callback(false);
      }
    })
    .catch(err => {
      callback(false);
    });
};

exports.verificarPerfil = (req, nivel) => {
  return new Promise((resolve, reject) => {
    try {
      const token = req.headers.authorization.split(" ")[1];
      var logger = req.app.get("winston");
      jwt.verify(token, key.tokenKey, function(err, payload) {
        if (payload) {
          var redis = req.app.get("redis");
          redis.get(payload.id, function(err, usuario) {
            usuario = JSON.parse(usuario);
            redis.get("perfil-" + usuario.perfil_codigo, (err, perfil) => {
              if (perfil) {
                perfil = JSON.parse(perfil);
                perfil.ListaMenu.forEach(ItemMenu => {
                  //nivel de la ruta
                  const nivelRuta = parseInt(ItemMenu.nivel);
                  //obtiene el nombre del modulo de la url segun el nivel
                  const moduloUrl = req.originalUrl.split("/")[nivelRuta];
                  //modulo del perfil
                  const modulo = ItemMenu.tipo_modulo;
                  //verificar si el modulo al que se desea ingresar
                  if (moduloUrl == modulo) {
                    //verificar el nivel al que se desea entrar
                    const nivelAccesoPerfil = ItemMenu.lista_menu.nivel_acceso;
                    if (nivel <= nivelAccesoPerfil) {
                      resolve(true);
                    } else {
                      reject(false);
                    }
                  }
                });
              } else {
                models.perfil
                  .findOne({
                    where: {
                      perfil_codigo: usuario.perfil_codigo
                    },
                    include: ["ListaMenu"]
                  })
                  .then(perfilBD => {
                    //GUARDAR PERFIL EN REDIS
                    cache.setValue(
                      "perfil-" + usuario.perfil_codigo,
                      JSON.stringify({
                        ListaMenu: perfilBD.ListaMenu
                      })
                    );
                    //guardarPerfil(redis, perfilBD);
                    perfilBD.ListaMenu.forEach(ItemMenu => {
                      //nivel de la ruta
                      const nivelRuta = parseInt(ItemMenu.nivel);
                      //obtiene el nombre del modulo de la url segun el nivel
                      const moduloUrl = req.originalUrl.split("/")[nivelRuta];
                      //modulo del perfil
                      const modulo = ItemMenu.tipo_modulo;
                      //verificar si el modulo al que se desea ingresar
                      if (moduloUrl == modulo) {
                        //verificar el nivel al que se desea entrar
                        const nivelAccesoPerfil = ItemMenu.lista_menu.nivel_acceso;
                        if (nivel <= nivelAccesoPerfil) {
                          resolve(true);
                        } else {
                          reject(false);
                        }
                      }
                    });
                  });
              }
            });
          });
        } else if (err) {
          logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
          reject(false);
        }
      });
    } catch (e) {
      logger.log("error", { ubicacion: filename, token: token, e });
      reject(false);
    }
  });
};
