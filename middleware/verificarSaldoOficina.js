const Sequelize = require("sequelize");
const models = require("../models");
import utils from "../services/utils";
const Op = Sequelize.Op;
var filename = module.filename.split("/").slice(-1);

const VerificarSaldoOficina = () => {
  return (req, res, next) => {
    var logger = req.app.get("winston");
    var socket = req.app.get("socketio");
    var redis = req.app.get("redis");
    const token = req.header("Authorization").split(" ")[1];
    utils.decodeToken(token, tokenDecodificado => {
      redis.get(tokenDecodificado.id, (err, usuario) => {
        usuario = JSON.parse(usuario);
        redis.get("contrato-" + usuario.oficina_codigo, function(err, contrato) {
          contrato = JSON.parse(contrato);
          if (contrato) {
            if (contrato.contrato_estado == "true") {
              const hoy = new Date();
              const yyyy = hoy.getFullYear();
              const mm = ("0" + (hoy.getMonth() + 1)).slice(-2);
              const dd = ("0" + hoy.getDate()).slice(-2);
              const fechaHoy = `${yyyy}-${mm}-${dd}`;
              models.sequelize
                .query(`select * from saldos_contables(:fecha, :oficina);`, {
                  replacements: {
                    fecha: fechaHoy,
                    oficina: usuario.oficina_codigo
                  },
                  type: models.sequelize.QueryTypes.SELECT
                })
                .then(resp => {
                  if (resp) {
                    const montoGiro =
                      parseFloat(req.body.importe) +
                      parseFloat(req.body.comision_dt) +
                      (req.body.comision_banco ? parseFloat(req.body.comision_banco) : 0);

                    //VERIFICAR SALDOS EN CAJA
                    if (contrato.oficina.tipo_arreglo == "REAL") {
                      if (parseFloat(resp[0].saldo_real) > parseFloat(contrato.credito_maximo) * -1) {
                        if (parseFloat(resp[0].saldo_real) + parseFloat(contrato.credito_maximo) < montoGiro) {
                          res.status(401).send(`Usted cuenta con S/. ${resp[0].saldo_real} de saldo, no se puede realizar esta operación`);
                          return;
                        } else {
                          next();
                        }
                      } else {
                        res.status(401).send(`Su oficina se encuentra con saldo negativo de (S/. ${resp[0].saldo_real})`);
                        return;
                      }
                    } else if (contrato.oficina.tipo_arreglo == "CONTABLE") {
                      if (parseFloat(resp[0].saldo_contable) > parseFloat(contrato.credito_maximo) * -1) {
                        if (parseFloat(resp[0].saldo_contable) + parseFloat(contrato.credito_maximo) < montoGiro) {
                          res.status(401).send(`Usted cuenta con S/. ${resp[0].saldo_contable} de saldo, no se puede realizar esta operación`);
                          return;
                        } else {
                          next();
                        }
                      } else {
                        res.status(401).send(`Su oficina se encuentra con saldo negativo de (S/. ${resp[0].saldo_contable})`);
                        return;
                      }
                    } else {
                      res.status(401).send("Tipo de arreglo no encontrado");
                      return;
                    }

                    //ALERTA POR SOCKETIO (SALDO DESPUES DE REALIZAR LA OPERACION)
                    if (contrato.oficina.tipo_arreglo == "REAL") {
                      if (resp[0].saldo_real <= contrato.monto_alerta) {
                        socket.emit(tokenDecodificado.idc + "montoAlerta", {
                          saldo: parseFloat(resp[0].saldo_real) - montoGiro
                        });
                      }
                    } else if (contrato.oficina.tipo_arreglo == "CONTABLE") {
                      if (resp[0].saldo_contable <= contrato.monto_alerta) {
                        socket.emit(tokenDecodificado.idc + "montoAlerta", {
                          saldo: parseFloat(resp[0].saldo_contable) - montoGiro
                        });
                      }
                    }
                  } else {
                    res.status(409).send("No se puede verificar sus saldos");
                    return;
                  }
                })
                .catch(err => {
                  res.status(409).send("Error al verificar saldos");
                  return;
                });
            } else {
              next();
            }
          } else {
            next();
          }
        });
      });
    });
  };
};

module.exports = VerificarSaldoOficina;
