const Sequelize = require("sequelize");
var PdfPrinter = require("pdfmake");

const models = require("../models");
const moment = require("moment");
const utils = require("../services/utils")
const Op = Sequelize.Op;
var filename = module.filename.split("/").slice(-1);
const imagesvg = '<svg width="162" height="100" viewBox="0 0 162 100" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0)"><path d="M101.864 39.6142C101.797 40.6218 101.82 41.6335 101.933 42.637C102.957 51.2487 107.385 57.6387 115.586 61.3762C117.216 62.1254 118.667 62.7627 118.24 59.7658C117.472 54.392 118.505 49.1647 120.117 44.101C121.815 38.6163 122.466 32.8567 122.038 27.1271C120.681 15.8371 107.428 6.40719 104.441 5.59768C103.033 5.21877 100.823 4.46954 100.038 5.14987C98.5362 6.45025 100.141 8.29317 100.687 9.82607C102.044 13.6583 102.47 19.2129 102.76 22.5026C102.837 23.4397 102.837 24.3816 102.76 25.3187L101.864 39.6142Z" fill="#F38F2E"/>'+
'<path d="M66.6041 41.9997C67.2006 43.2344 67.891 44.4206 68.6692 45.5477C75.4021 55.2446 84.0722 60.2652 94.85 60.0241C96.9833 59.981 98.8863 59.9035 96.4713 56.5794C92.1619 50.6373 89.7725 43.834 88.0744 36.8843C86.2141 29.2714 82.2545 20.5219 78.8496 15.6132C70.0516 2.97106 50.4075 -0.663109 46.8405 0.111951C45.1338 0.465034 42.4372 0.835338 42.0788 2.10127C41.4132 4.49534 44.2548 5.76128 45.8165 7.26834C49.7077 11.0489 53.8038 17.413 56.2615 21.1505C56.9625 22.2181 57.5925 23.3315 58.1474 24.4833L66.6041 41.9997Z" fill="url(#paint0_linear)"/><path d="M44.5107 61.5656C45.7092 62.7654 46.9895 63.879 48.3422 64.8984C59.999 73.6566 71.7069 76.5329 83.3978 72.8298C85.7189 72.0892 87.767 71.4089 83.6624 68.4464C76.315 63.1416 70.6829 56.2521 65.742 48.9838C60.3318 41.0265 52.0884 32.4492 46.2344 28.0141C31.0107 16.6121 7.89341 18.7823 4.3264 20.7544C2.6197 21.6931 -0.170761 22.9762 -9.09208e-05 24.5091C0.324182 27.4199 4.00212 27.9538 6.37444 29.1423C12.3479 32.1564 19.6099 38.0038 23.9535 41.4226C25.1966 42.3932 26.3793 43.44 27.4949 44.5573L44.5107 61.5656Z" fill="url(#paint1_linear)"/>'+
'<path d="M111.089 96.0128C108.511 97.1113 105.841 97.9759 103.11 98.5963C101.881 98.8546 100.456 99.1388 98.8435 99.4575C84.5584 102.179 76.8612 94.8329 67.7474 86.5398C65.9383 84.8949 63.4124 80.279 69.0359 82.32C77.5694 85.403 92.358 82.1047 99.8334 77.5577C108.026 72.5801 115.603 66.8188 130.11 62.9866C148.653 58.9735 156.342 68.2484 159.124 71.2539C160.515 72.7609 162.452 74.6986 161.966 76.1454C161.385 77.8677 158.629 76.619 155.992 76.4554C142.023 75.5942 137.935 79.3403 131.936 83.2415C129.419 84.8691 126.671 87.4182 123.113 89.9328C120.916 91.4678 118.572 92.7748 116.115 93.834L111.089 96.0128Z" fill="url(#paint2_linear)"/></g><defs><linearGradient id="paint0_linear" x1="97.5977" y1="30.012" x2="41.9764" y2="30.012" gradientUnits="userSpaceOnUse"><stop stop-color="#3883C5"/><stop offset="0.1" stop-color="#3891CF"/><stop offset="0.24" stop-color="#399CD7"/><stop offset="0.44" stop-color="#39A3DC"/><stop offset="1" stop-color="#39A5DD"/></linearGradient><linearGradient id="paint1_linear" x1="86.0091" y1="46.7878" x2="-9.38553e-05" y2="46.7878" gradientUnits="userSpaceOnUse">'+
'<stop stop-color="#315BAA"/><stop offset="0.09" stop-color="#3268B3"/><stop offset="0.31" stop-color="#3583C6"/><stop offset="0.53" stop-color="#3796D3"/><stop offset="0.76" stop-color="#39A1DA"/><stop offset="1" stop-color="#39A5DD"/></linearGradient><linearGradient id="paint2_linear" x1="23019.4" y1="12383.4" x2="33919.9" y2="12383.4" gradientUnits="userSpaceOnUse"><stop stop-color="#315BAA"/><stop offset="1" stop-color="#39A5DD"/></linearGradient><clipPath id="clip0"><rect width="162" height="100" fill="white"/></clipPath></defs></svg>'

exports.operaciones = (req, res) => {
  var logger = req.app.get("winston");
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, async (err, usuario) => {
      usuario = JSON.parse(usuario);
      const id_cuenta = req.query.id_cuenta;
      const caja_codigo = req.query.caja_codigo ? req.query.caja_codigo : "*";
      const fecha_inicio = req.query.fecha_inicio;
      const fecha_fin = req.query.fecha_fin;

      models.sequelize
        .query(
          `select *  from buscar_operaciones_clientes(id_cuenta:= :id_cuenta, caja_origen:= :caja_codigo, fecha_inicio:= :fecha_inicio, fecha_fin:= :fecha_fin);`,
          {
            replacements: {
              id_cuenta: id_cuenta,
              caja_codigo: caja_codigo,
              fecha_inicio: fecha_inicio,
              fecha_fin: fecha_fin
            },
            type: models.sequelize.QueryTypes.SELECT,
            nest: true
          }
        )
        .then(resp => {
          models.sequelize
            .query(`select * from saldos_cuenta_clientes(:id_cuenta);`, {
              replacements: {
                id_cuenta: id_cuenta
              },
              type: models.sequelize.QueryTypes.SELECT,
              nest: true
            })
            .then(saldos => {
              if (saldos) {
                const saldoSoles = saldos[0].depositosoles - saldos[0].retirosoles;
                const saldoDolares = saldos[0].depositodolares - saldos[0].retirodolares;
                res.json({ operaciones: resp, saldos: { saldoSoles, saldoDolares } });
              } else {
                logger.log("warn", { ubicacion: filename, token: token, message: "No existe cuenta" });
                res.status(409).send("No existe cuenta");
              }
            });
        })
        .catch(err => {
          logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
          res.status(409).send(err.message);
        });
    });
  });
};

exports.operacionesOficina = (req, res) => {
  var logger = req.app.get("winston");
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, async (err, usuario) => {
      usuario = JSON.parse(usuario);
      const id_cuenta = req.query.id_cuenta;
      const caja_codigo = "*";
      const fecha_inicio = req.query.fecha_inicio;
      const fecha_fin = req.query.fecha_fin;

      models.sequelize
        .query(
          `select *  from buscar_operaciones_clientes(id_cuenta:= :id_cuenta, caja_origen:= :caja_codigo, fecha_inicio:= :fecha_inicio, fecha_fin:= :fecha_fin);`,
          {
            replacements: {
              id_cuenta: id_cuenta,
              caja_codigo: caja_codigo,
              fecha_inicio: fecha_inicio,
              fecha_fin: fecha_fin
            },
            type: models.sequelize.QueryTypes.SELECT,
            nest: true
          }
        )
        .then(resp => {
          models.sequelize
            .query(`select * from saldos_cuenta_clientes(:id_cuenta);`, {
              replacements: {
                id_cuenta: id_cuenta
              },
              type: models.sequelize.QueryTypes.SELECT,
              nest: true
            })
            .then(saldos => {
              if (saldos) {
                res.json({ operaciones: resp, saldos: saldos[0] });
              } else {
                logger.log("warn", { ubicacion: filename, token: token, message: "No existe cuenta" });
                res.status(409).send("No existe cuenta");
              }
            });
        })
        .catch(err => {
          logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
          res.status(409).send(err);
        });
    });
  });
};