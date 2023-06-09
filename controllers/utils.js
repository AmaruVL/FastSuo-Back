const axios = require("axios");
const moment = require("moment");
const models = require("../models");
const key = require("../config/key");
const utils = require("../services/utils");
const DeviceDetector = require("node-device-detector");
const DEVICE_TYPE = require("node-device-detector/parser/const/device-type");
var filename = module.filename.split("/").slice(-1);
const hash = require("object-hash");
const cache = require("../config/cache");

exports.cerrarSesion = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  var redis = req.app.get("redis");
  var socket = req.app.get("socketio");
  const detector = new DeviceDetector();
  const userAgent = req.headers["user-agent"];
  const result = detector.detect(userAgent);
  const isTabled = result.device && [DEVICE_TYPE.TABLET].indexOf(result.device.type) !== -1;
  const isMobile = result.device && [DEVICE_TYPE.SMARTPHONE, DEVICE_TYPE.FEATURE_PHONE].indexOf(result.device.type) !== -1;
  const isPhablet = result.device && [DEVICE_TYPE.PHABLET].indexOf(result.device.type) !== -1;
  let esMobil = false;
  if (isTabled || isMobile || isPhablet) {
    esMobil = true;
  }

  utils.decodeToken(token, tokenDecodificado => {
    try {
      var inicio = Date.now();
      var end = new Date();
      const fin = end.setHours(23, 59, 59, 999);
      const total = Math.trunc((fin - inicio) / 1000);
      if (esMobil) {
        redis.get(tokenDecodificado.id, function(err, usuario) {
          usuario = JSON.parse(usuario);
          delete usuario["token_mobil"];
          cache.setValue(tokenDecodificado.id, JSON.stringify(usuario), total);
          socket.emit(tokenDecodificado.id + "mobillogout", result.device);
        });
      } else {
        redis.get(tokenDecodificado.id, function(err, usuario) {
          usuario = JSON.parse(usuario);
          delete usuario["token"];
          cache.setValue(tokenDecodificado.id, JSON.stringify(usuario), total);
        });
      }
      res.json({ mensaje: "exito" });
    } catch (error) {
      logger.log("error", { ubicacion: filename, error });
      res.status(409).send(error.message);
    }
  });
};

exports.cerrarSesionMobil = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  var redis = req.app.get("redis");
  utils.decodeToken(token, tokenDecodificado => {
    var inicio = Date.now();
    var end = new Date();
    const fin = end.setHours(23, 59, 59, 999);
    const total = Math.trunc((fin - inicio) / 1000);
    try {
      redis.get(tokenDecodificado.id, function(err, usuario) {
        usuario = JSON.parse(usuario);
        delete usuario["token_mobil"];
        cache.setValue(tokenDecodificado.id,JSON.stringify(usuario), total);
      });
      res.json({ mensaje: "exito" });
    } catch (error) {
      logger.log("error", { ubicacion: filename, error });
      res.status(409).send(error.message);
    }
  });
};

exports.buscarDocumento = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.cliente_proveedor
    .findOne({
      where: {
        id_cliente: req.query.documento
      }
    })
    .then(cliente => {
      if (cliente != null) {
        res.json(cliente);
      } else {
        throw new Error("No existe en BD");
      }
    })
    .catch(err => {
      axios({
        method: "get",
        baseURL: `http://localhost:6060/dni/${req.query.documento}`,
        url: ``, 
      })
      .then(response => {
        const datos = response.data;
        if (datos.ap_paterno !== undefined) {
          res.json({
            dni: req.query.documento,
            nombres: datos.nombres,
            ap_paterno: datos.ap_paterno,
            ap_materno: datos.ap_materno,
            fecha_nacimiento: datos.fecha_nacimiento,
            sexo: datos.sexo,
            direccion: datos.direccion
          });
        } else {
          res.status(409).send("DNI no encontrado");
        }
      })
      .catch(err => {
        logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
        res.status(409).send("no encontrado");
        console.log(err)
      });
    });
};

exports.buscarRuc = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  axios({
    method: "post",
    baseURL: "http://services.wijoata.com/consultar-ruc/api/ruc",
    url: `/${req.params.ruc}`,
    timeout: 3000,
    headers: {
      "content-type": "application/json"
    }
  })
    .then(response => {
      let datos = response.data;
      if (datos.ruc) {
        res.json({
          razon_social: datos.razonSocial,
          contribuyente_estado: "Activo",
          domicilio_fiscal: datos.direccion,
          representante_legal: ""
        });
      } else {
        res.status(400).json({
          error: "RUC no encontrado"
        });
      }
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(400).json({
        error: "RUC no encontrado"
      });
    });
};

exports.tipoCambio = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  var d = new Date();
  const yyyy = d.getFullYear();
  const mm = ("0" + (d.getMonth() + 1)).slice(-2);
  const dd = ("0" + d.getDate()).slice(-2);
  const fecha = `${yyyy}-${mm}-${dd}`;
  axios({
    method: "get",
    baseURL: "https://www.deperu.com/api/rest/cotizaciondolar.json",
    headers: {
      "content-type": "application/json"
    }
  })
    .then(response => {
      let datos = response.data;
      if (datos) {
        const fecha = moment().format("YYYY-MM-DD");
        let tipocambio = {};
        tipocambio[fecha] = {
          compra: datos.cotizacion[0].Compra,
          venta: datos.cotizacion[0].Venta
        };
        res.json(tipocambio);
      } else {
        res.status(400).json("Sin datos");
      }
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(400).json("Error");
    });
};

exports.codValidacionIntercambio = (req, res) => {
  const hoy = moment().format("DD/MM/YYYY hh:mm");
  let hashcalculado = hash([key.tokenIntercambio, hoy]);
  res.json({ hash: hashcalculado });
};