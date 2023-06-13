const utils = require('../helpers/utils');
const DeviceDetector = require('node-device-detector');
const DEVICE_TYPE = require('node-device-detector/parser/const/device-type');
const filename = module.filename.split('/').slice(-1);
const cache = require('../config/cache');

exports.cerrarSesion = (req, res) => {
  const logger = req.app.get('winston');
  const token = req.header('Authorization').split(' ')[1];

  const socket = req.app.get('socketio');
  const detector = new DeviceDetector();
  const userAgent = req.headers['user-agent'];
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

  utils.decodeToken(token, (tokenDecodificado) => {
    try {
      const inicio = Date.now();
      const end = new Date();
      const fin = end.setHours(23, 59, 59, 999);
      const total = Math.trunc((fin - inicio) / 1000);
      if (esMobil) {
        let usuario = cache.getValue(tokenDecodificado.id);
        usuario = JSON.parse(usuario);
        delete usuario['token_mobil'];
        cache.setValue(tokenDecodificado.id, JSON.stringify(usuario), total);
        socket.emit(tokenDecodificado.id + 'mobillogout', result.device);
      } else {
        let usuario = cache.getValue(tokenDecodificado.id);
        usuario = JSON.parse(usuario);
        delete usuario['token'];
        cache.setValue(tokenDecodificado.id, JSON.stringify(usuario), total);
      }
      res.json({ mensaje: 'exito' });
    } catch (error) {
      logger.log('error', { ubicacion: filename, error });
      res.status(409).send(error.message);
    }
  });
};

exports.cerrarSesionMobil = (req, res) => {
  const logger = req.app.get('winston');
  const token = req.header('Authorization').split(' ')[1];

  utils.decodeToken(token, (tokenDecodificado) => {
    const inicio = Date.now();
    const end = new Date();
    const fin = end.setHours(23, 59, 59, 999);
    const total = Math.trunc((fin - inicio) / 1000);
    try {
      let usuario = cache.getValue(tokenDecodificado.id);
      usuario = JSON.parse(usuario);
      delete usuario['token_mobil'];
      cache.setValue(tokenDecodificado.id, JSON.stringify(usuario), total);
      res.json({ mensaje: 'exito' });
    } catch (error) {
      logger.log('error', { ubicacion: filename, error });
      res.status(409).send(error.message);
    }
  });
};
