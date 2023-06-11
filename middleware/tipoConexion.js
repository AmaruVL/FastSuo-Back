const jwt = require("jsonwebtoken");
const key = require("../config/key");
const models = require("../models");
const DeviceDetector = require("node-device-detector");
const DEVICE_TYPE = require("node-device-detector/parser/const/device-type");
const cache = require("../config/cache");
var filename = module.filename.split("/").slice(-1);

//VERIFICAR SI SE ENCUENTRA LOGUEADO
exports.tipoConexion = () => {
  return (req, res, next) => {
    const detector = new DeviceDetector();
    const userAgent = req.headers["user-agent"];
    const headers = req.headers;
    const result = detector.detect(userAgent);
    const isTabled =
      result.device && [DEVICE_TYPE.TABLET].indexOf(result.device.type) !== -1;
    const isMobile =
      result.device &&
      [DEVICE_TYPE.SMARTPHONE, DEVICE_TYPE.FEATURE_PHONE].indexOf(result.device.type) !==
        -1;
    const isPhablet =
      result.device && [DEVICE_TYPE.PHABLET].indexOf(result.device.type) !== -1;
    let esMobil = false;
    if (isTabled || isMobile || isPhablet) {
      esMobil = true;
    }

    try {
      var logger = req.app.get("winston");
      const auth = req.headers.authorization.split(" "); // "bearer token nspc hashexplorador"
      const token = auth[1];

      jwt.verify(token, key.tokenKey, function (err, tokenDecodificado) {
        if (tokenDecodificado) {
          let usuario_codigo = tokenDecodificado.id;
          let usuario = cache.getValue(usuario_codigo);
          usuario = JSON.parse(usuario);
          if (usuario !== null) {
            let tokenCache = usuario.token;
            if (esMobil) {
              tokenCache = usuario.token_mobil;
              console.log("headerss x2", headers);
            }
            if (tokenCache === token) {
              if (usuario.modo_conexion === 1) {
                if (auth.length >= 3) {
                  if (usuario.pc_sn === auth[2]) {
                    next();
                    console.log("headers", headers);
                  } else {
                    logger.log("warn", {
                      ubicacion: filename,
                      token: token,
                      message: "Dispositivo no reconocido 01",
                    });
                    res.status(403).send("Dispositivo no reconocido 01");
                  }
                } else {
                  logger.log("warn", {
                    ubicacion: filename,
                    token: token,
                    message: "No puede realizar esta operación 02",
                  });
                  res.status(403).send("No puede realizar esta operación 02");
                }
              } else if (usuario.modo_conexion === 2) {
                if (auth.length === 4) {
                  next();
                  console.log("headers x3", headers);
                } else {
                  logger.log("warn", {
                    ubicacion: filename,
                    token: token,
                    message: "No puede realizar esta operación 03",
                  });
                  res.status(403).send("No puede realizar esta operación 03");
                }
              } else if (usuario.modo_conexion === 3) {
                if (auth.length === 3) {
                  if (usuario.pc_sn === auth[2]) {
                    next();
                    console.log("headers x4", headers);
                  } else {
                    logger.log("warn", {
                      ubicacion: filename,
                      token: token,
                      message: "Dispositivo no reconocido 04",
                    });
                    res.status(403).send("Dispositivo no reconocido 04");
                  }
                } else {
                  logger.log("warn", {
                    ubicacion: filename,
                    token: token,
                    message: "No puede realizar esta operación 05",
                  });
                  res.status(403).send("No puede realizar esta operación 05");
                }
              } else if (usuario.modo_conexion === 4) {
                next();
                console.log("headers x5", headers);
                console.log("detector?", result);
                console.log("tipo conexion", result.os.name + " | " + result.client.name);
                console.log("tipo movil", result.device.type);
                console.log(
                  "nombre dispositivo",
                  result.device.brand + " | " + result.device.model,
                );
                /*console.log('device', result.device);
                console.log('os', result.os.name + '|'+result.client.name);
                console.log('client', result.client);*/
              } else {
                logger.log("warn", {
                  ubicacion: filename,
                  token: token,
                  message: "No puede realizar esta operación 06",
                });
                res.status(403).send("No puede realizar esta operación 06");
              }
            } else {
              logger.log("warn", {
                ubicacion: filename,
                token: token,
                message: "Su token cambio, vuelva a iniciar sesion",
              });
              res.status(403).send("Su token cambio, vuelva a iniciar sesion");
            }
          } else {
            logger.log("warn", filename, {
              ubicacion: filename,
              token: token,
              message: "Token eliminado, vuelva a iniciar sesion",
            });
            res.status(403).send("Token eliminado, vuelva a iniciar sesion");
          }
        } else if (err) {
          logger.log("warn", filename, {
            ubicacion: filename,
            token: token,
            message: "token invalido",
          });
          res.status(403).send("token invalido");
        }
      });
    } catch (e) {
      logger.log("warn", filename, {
        ubicacion: filename,
        message: e.message,
      });
      res.status(403).send("falta token");
    }
  };
};
