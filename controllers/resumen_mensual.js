const Excel = require("exceljs");
const Sequelize = require("sequelize");
const models = require("../models");
const moment = require("moment");
// import utils from "../services/utils";
const Op = Sequelize.Op;
var filename = module.filename.split("/").slice(-1);

exports.excel = async (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];

  const oficinaCodigo = req.params.oficina;
  const fechai = req.params.fechai;
  const fechaf = req.params.fechaf;

  const oficina = await models.oficina.findOne({
    where: {
      oficina_codigo: oficinaCodigo
    }
  });

  //LISTAR GIROS DESDE OFICINA XXXXXXX
  models.sequelize
    .query(
      `SELECT * FROM resumen_mensual2(oficina_origen:= :oficina, oficina_tipo_arreglo:= :tipo_arreglo ,fecha_inicio:= :fechai, fecha_fin:= :fechaf)`,
      {
        replacements: {
          oficina: oficinaCodigo ? oficinaCodigo : "*",
          fechai: fechai ? fechai : "",
          fechaf: fechaf ? fechaf : "",
          tipo_arreglo: oficina.tipo_arreglo
        },
        type: models.sequelize.QueryTypes.SELECT
      }
    )
    .then(lista => {
      let listaTransferencias = [];
      lista.forEach(fila => {
        listaTransferencias.push({
          ...fila,
          solicitud_fecha_hora: moment(fila.solicitud_fecha_hora)
            .locale("es")
            .format("DD/MM/Y HH:mm:ss"),
          importe: parseFloat(fila.importe),
          comision_dt: parseFloat(fila.comision_dt),
          comision_banco: parseFloat(fila.comision_banco),
          gastos_administrativos: fila.gastos_administrativos ? parseFloat(fila.gastos_administrativos) : 0,
          comisionorigen: parseFloat(fila.comisionorigen)
        });
      });

      //LISTAR GIROS PARA OFICINA XXXXXXX
      models.sequelize
        .query(
          `SELECT * FROM resumen_mensual2(oficina_destino:= :oficina, oficina_tipo_arreglo:= :tipo_arreglo, fecha_inicio:= :fechai, fecha_fin:= :fechaf)`,
          {
            replacements: {
              oficina: oficinaCodigo ? oficinaCodigo : "*",
              fechai: fechai ? fechai : "",
              fechaf: fechaf ? fechaf : "",
              tipo_arreglo: oficina.tipo_arreglo
            },
            type: models.sequelize.QueryTypes.SELECT
          }
        )
        .then(listaOPs => {
          let listaOrdenesPago = [];
          listaOPs.forEach(op => {
            listaOrdenesPago.push({
              ...op,
              importe: parseFloat(op.importe),
              comision_banco: parseFloat(op.comision_banco),
              comision_dt: parseFloat(op.comision_dt),
              comisiondestino: parseFloat(op.comisiondestino)
            });
          });

          models.sequelize
            .query(
              `SELECT * FROM resumen_mensual_descuentos2(oficina_origen:= :oficina, oficina_tipo_arreglo:= :tipo_arreglo, fecha_inicio:= :fechai, fecha_fin:= :fechaf)`,
              {
                replacements: {
                  oficina: oficinaCodigo ? oficinaCodigo : "*",
                  fechai: fechai ? fechai : "",
                  fechaf: fechaf ? fechaf : "",
                  tipo_arreglo: oficina.tipo_arreglo
                },
                type: models.sequelize.QueryTypes.SELECT
              }
            )
            .then(async listaReem => {
              let listaReembolsos = [];
              listaReem.forEach(op => {
                listaReembolsos.push({
                  ...op,
                  solicitud_fecha_hora: moment(op.solicitud_fecha_hora)
                    .locale("es")
                    .format("DD/MM/Y HH:mm:ss"),
                  anulacion_fecha_hora: moment(op.anulacion_fecha_hora)
                    .locale("es")
                    .format("DD/MM/Y HH:mm:ss"),
                  importe: parseFloat(op.importe),
                  comision_banco: parseFloat(op.comision_banco),
                  comision_dt: parseFloat(op.comision_dt),
                  comisionorigen: parseFloat(op.comisionorigen)
                });
              });

              models.sequelize
                .query(
                  `SELECT * FROM resumen_mensual_descuentos2(oficina_destino:= :oficina, oficina_tipo_arreglo:= :tipo_arreglo, fecha_inicio:= :fechai, fecha_fin:= :fechaf)`,
                  {
                    replacements: {
                      oficina: oficinaCodigo ? oficinaCodigo : "*",
                      fechai: fechai ? fechai : "",
                      fechaf: fechaf ? fechaf : "",
                      tipo_arreglo: oficina.tipo_arreglo
                    },
                    type: models.sequelize.QueryTypes.SELECT
                  }
                )
                .then(async listaReem => {
                  let listaAnulacionesOrdenPago = [];
                  listaReem.forEach(op => {
                    listaAnulacionesOrdenPago.push({
                      ...op,
                      solicitud_fecha_hora: moment(op.solicitud_fecha_hora)
                        .locale("es")
                        .format("DD/MM/Y HH:mm:ss"),
                      anulacion_fecha_hora: moment(op.anulacion_fecha_hora)
                        .locale("es")
                        .format("DD/MM/Y HH:mm:ss"),
                      importe: parseFloat(op.importe),
                      comision_banco: parseFloat(op.comision_banco),
                      comision_dt: parseFloat(op.comision_dt),
                      comisiondestino: parseFloat(op.comisiondestino)
                    });
                  });

                  const ofi = await models.oficina.findOne({
                    where: {
                      oficina_codigo: oficinaCodigo
                    }
                  });
                  const oficina_nombre = ofi.oficina_nombre;

                  const habilitaciones = await models.sequelize.query(`select * from resumen_mensual_habilitaciones(:oficina, :fechai, :fechaf);`, {
                    replacements: {
                      oficina: oficinaCodigo ? oficinaCodigo : "*",
                      fechai: fechai ? fechai : "",
                      fechaf: fechaf ? fechaf : ""
                    },
                    type: models.sequelize.QueryTypes.SELECT
                  });
                  let habilitacionesEnviadas = 0;
                  let habilitacionesAceptadas = 0;
                  habilitaciones.forEach(hab => {
                    if (hab.destino_oficina_codigo == oficinaCodigo && hab.moneda == "SOLES") {
                      habilitacionesAceptadas = habilitacionesAceptadas + parseFloat(hab.importe);
                    } else if (hab.origen_oficina_codigo == oficinaCodigo && hab.moneda == "SOLES") {
                      habilitacionesEnviadas = habilitacionesEnviadas + parseFloat(hab.importe);
                    }
                  });
                  //OBTENER SALDO DE OFICINA
                  const fechaSaldoInicial = moment(fechai)
                    .subtract(1, "d")
                    .format("YYYY-MM-DD");
                  const saldoInicial = await models.sequelize.query(`select * from saldos_contables(:fecha, :oficina);`, {
                    replacements: {
                      fecha: fechaSaldoInicial,
                      oficina: oficinaCodigo
                    },
                    type: models.sequelize.QueryTypes.SELECT
                  });

                  const saldoOficina =
                    oficina.tipo_arreglo === "CONTABLE" ? parseFloat(saldoInicial[0].saldo_contable) : parseFloat(saldoInicial[0].saldo_real);

                  var workbook = new Excel.Workbook();
                  workbook.creator = "Money Express Center";
                  workbook.lastModifiedBy = "Money Express Center";
                  workbook.created = new Date();
                  workbook.modified = new Date();
                  workbook.views = [
                    {
                      x: 0,
                      y: 0,
                      width: 600,
                      height: 600,
                      firstSheet: 0,
                      activeTab: 0,
                      visibility: "visible"
                    }
                  ];
                  let hoja_resumen = workbook.addWorksheet("Resumen");
                  let hoja_transferencias = workbook.addWorksheet("Giros");
                  let hoja_orden_pago = workbook.addWorksheet("Giros Pagados");
                  let hoja_reembolso_giro = workbook.addWorksheet("Giros Anulados y Reembolsados");
                  let periodo = moment(fechai)
                    .locale("es")
                    .format("MMMM YYYY");
                  construirHojaResumen(
                    "Money Express Center",
                    oficina_nombre,
                    periodo,
                    hoja_resumen,
                    saldoOficina,
                    oficina.tipo_arreglo,
                    habilitacionesEnviadas,
                    habilitacionesAceptadas
                  );
                  construirHojaTransferencias(oficina_nombre, listaTransferencias, hoja_transferencias);
                  if (oficina.tipo_arreglo == "REAL") {
                    construirHojaOrdenpagoReal(oficina_nombre, listaOrdenesPago, hoja_orden_pago);
                  } else if (oficina.tipo_arreglo == "CONTABLE") {
                    construirHojaOrdenpagoContable(oficina_nombre, listaOrdenesPago, hoja_orden_pago);
                  }
                  construirHojaReembolsosGiros(oficina_nombre, listaReembolsos, hoja_reembolso_giro);
                  if (oficina.tipo_arreglo == "CONTABLE") {
                    let hoja_reembolso_orden_pago = workbook.addWorksheet("Orden de pago Anulados");
                    construirHojaReembolsosOrdenPago(oficina_nombre, listaAnulacionesOrdenPago, hoja_reembolso_orden_pago);
                  }

                  //CONSTRUIR EXCEL
                  res.status(200);
                  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
                  res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
                  res.setHeader("Content-Disposition", `attachment; filename=${oficina_nombre}.xlsx`);
                  workbook.xlsx.write(res).then(function() {
                    res.end();
                  });
                })
                .catch(err => {
                  logger.log("error", { ubicacion: filename, token: token, message: err.message });
                  res.status(409).send("Error al generar");
                });
            })
            .catch(err => {
              logger.log("error", { ubicacion: filename, token: token, message: err.message });
              res.status(409).send("Error al generar");
            });
        })
        .catch(err => {
          logger.log("error", { ubicacion: filename, token: token, message: err.message });
          res.status(409).send("Error al generar");
        });
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: err.message });
      res.status(409).send("Error al generar");
    });
};

function construirHojaResumen(
  empresa_nombre,
  oficina_nombre,
  periodo,
  hoja_transferencias,
  saldoOficina,
  tipoArreglo,
  habilitacionesEnviadas,
  habilitacionesAceptadas
) {
  hoja_transferencias.columns = [
    {
      key: "COL1",
      width: 8
    },
    {
      key: "COL2",
      width: 24
    },
    {
      key: "COL3",
      width: 18
    },
    {
      key: "COL4",
      width: 18
    },
    {
      key: "COL5",
      width: 14
    },
    {
      key: "COL6",
      width: 8
    }
  ];
  hoja_transferencias.getCell("A1").value = "Empresa:";
  hoja_transferencias.mergeCells("B1", "F1");
  hoja_transferencias.getCell("B1").value = empresa_nombre;
  hoja_transferencias.getCell("A1").alignment = {
    horizontal: "right"
  };
  hoja_transferencias.getCell("A1").font = {
    name: "Calibri",
    size: 12,
    bold: true,
    color: {
      argb: "FF000000"
    }
  };
  hoja_transferencias.getCell("B1").alignment = {
    horizontal: "center"
  };
  hoja_transferencias.getCell("B1").font = {
    name: "Calibri",
    size: 14,
    bold: true,
    color: {
      argb: "FF000000"
    }
  };

  hoja_transferencias.getCell("A2").value = "Oficina:";
  hoja_transferencias.mergeCells("B2", "F2");
  hoja_transferencias.getCell("B2").value = oficina_nombre;
  hoja_transferencias.getCell("A2").alignment = {
    horizontal: "right"
  };
  hoja_transferencias.getCell("A2").font = {
    name: "Calibri",
    size: 12,
    bold: true,
    color: {
      argb: "FF000000"
    }
  };
  hoja_transferencias.getCell("B2").alignment = {
    horizontal: "center"
  };
  hoja_transferencias.getCell("B2").font = {
    name: "Calibri",
    size: 14,
    bold: true,
    color: {
      argb: "FF000000"
    }
  };

  hoja_transferencias.getCell("A3").value = "Periodo:";
  hoja_transferencias.mergeCells("B3", "F3");
  hoja_transferencias.getCell("B3").value = periodo;
  hoja_transferencias.getCell("A3").alignment = {
    horizontal: "right"
  };
  hoja_transferencias.getCell("A3").font = {
    name: "Calibri",
    size: 12,
    bold: true,
    color: {
      argb: "FF000000"
    }
  };
  hoja_transferencias.getCell("B3").alignment = {
    horizontal: "center"
  };
  hoja_transferencias.getCell("B3").font = {
    name: "Calibri",
    size: 14,
    bold: true,
    color: {
      argb: "FF000000"
    }
  };

  //ENCABEZADOS
  hoja_transferencias.getRow(6).values = ["Nro", "Detalle", "Saldo Deudor", "Saldo Acreedor", "Contable", "Cant."];
  ["A6", "B6", "C6", "D6", "E6", "F6", "G6", "H6", "I6", "J6", "K6"].map(key => {
    hoja_transferencias.getCell(key).font = {
      name: "Calibri",
      size: 12,
      bold: true,
      color: {
        argb: "FFFFFFFF"
      }
    };
  });

  ["A6", "B6", "C6", "D6", "E6", "F6"].map(key => {
    hoja_transferencias.getCell(key).alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true
    };
  });
  ["A6", "B6", "C6", "D6", "E6", "F6"].map(key => {
    hoja_transferencias.getCell(key).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FF305496"
      }
    };
  });

  hoja_transferencias.getCell("A7").value = 1;
  hoja_transferencias.getCell("A8").value = 2;
  hoja_transferencias.getCell("A9").value = 3;
  hoja_transferencias.getCell("A10").value = 4;
  hoja_transferencias.getCell("A11").value = 5;
  hoja_transferencias.getCell("A12").value = 6;
  hoja_transferencias.getCell("A13").value = 7;
  hoja_transferencias.getCell("A14").value = 8;
  hoja_transferencias.getCell("A15").value = 9;
  hoja_transferencias.getCell("A16").value = 10;
  hoja_transferencias.getCell("A17").value = 11;
  hoja_transferencias.getCell("A18").value = 12;

  ["A7", "A8", "A9", "A10", "A11", "A12", "A13", "A14", "A15", "A16", "A17", "A18"].map(key => {
    hoja_transferencias.getCell(key).alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true
    };
  });
  ["A7", "A8", "A9", "A10", "A11", "A12", "A13", "A14", "A15", "A16", "A17", "A18"].map(key => {
    hoja_transferencias.getCell(key).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FFddebf7"
      }
    };
  });

  hoja_transferencias.getCell("B7").value = "Saldo inicio periodo";
  hoja_transferencias.getCell("B8").value = "Giros validos de oficina";
  hoja_transferencias.getCell("B9").value = "Dt de giros de oficina";
  hoja_transferencias.getCell("B10").value = "Gastos administrativos";
  hoja_transferencias.getCell("B11").value = "Giros pagados";
  hoja_transferencias.getCell("B12").value = "Dt de Giros pagados";
  hoja_transferencias.getCell("B13").value = "Giros ANULADOS";
  hoja_transferencias.getCell("B14").value = "Dt giros ANULADOS";
  hoja_transferencias.getCell("B15").value = "Orden pago ANULADOS";
  hoja_transferencias.getCell("B16").value = "Giros REEMBOLSADOS";
  hoja_transferencias.getCell("B17").value = "DTs Giros REEMBOLSADOS";
  hoja_transferencias.getCell("B18").value = "Habilitaciones";

  if (saldoOficina < 0) {
    hoja_transferencias.getCell("C7").value = saldoOficina * -1;
  } else {
    hoja_transferencias.getCell("D7").value = saldoOficina;
  }
  hoja_transferencias.getCell("F7").value = 1;
  hoja_transferencias.getCell("C8").value = {
    formula: "Giros!F10006+Giros!F10007+Giros!F10008+Giros!H10006+Giros!H10007+Giros!H10008"
  };
  hoja_transferencias.getCell("F8").value = {
    formula: "Giros!E10006+Giros!E10007+Giros!E10008"
  };
  hoja_transferencias.getCell("C9").value = {
    formula: "Giros!G10006+Giros!G10007+Giros!G10008"
  };
  hoja_transferencias.getCell("C10").value = {
    formula: "Giros!J10006+Giros!J10007+Giros!J10008+Giros!J10009"
  };
  hoja_transferencias.getCell("C14").value = {
    formula: "Giros!G10009"
  };
  hoja_transferencias.getCell("D11").value = {
    formula: "'Giros Pagados'!F10006+'Giros Pagados'!F10007+'Giros Pagados'!F10008 + 'Giros Pagados'!H10006+'Giros Pagados'!H10007+'Giros Pagados'!H10008"
  };
  hoja_transferencias.getCell("F11").value = {
    formula: "'Giros Pagados'!E10006+'Giros Pagados'!E10007+'Giros Pagados'!E10008"
  };
  hoja_transferencias.getCell("E12").value = {
    formula: "'Giros Pagados'!G10006+'Giros Pagados'!G10007+'Giros Pagados'!G10008"
  };
  hoja_transferencias.getCell("D13").value = {
    formula: "'Giros Anulados y Reembolsados'!F10009 + 'Giros Anulados y Reembolsados'!H10009"
  };
  hoja_transferencias.getCell("E13").value = {
    formula: "Giros!F10009 + Giros!H10009"
  };
  hoja_transferencias.getCell("F13").value = {
    formula: "Giros!E10009"
  };
  hoja_transferencias.getCell("E15").value = {
    formula: "'Giros Pagados'!F10009 + 'Giros Pagados'!H10009"
  };
  hoja_transferencias.getCell("F15").value = {
    formula: "'Giros Pagados'!E10009"
  };
  if (tipoArreglo == "CONTABLE") {
    hoja_transferencias.getCell("D15").value = {
      formula: "('Orden de pago Anulados'!F10011 + 'Orden de pago Anulados'!H10011) * -1"
    };
  }
  hoja_transferencias.getCell("D16").value = {
    formula: "'Giros Anulados y Reembolsados'!F10010 + 'Giros Anulados y Reembolsados'!H10010"
  };
  hoja_transferencias.getCell("F16").value = {
    formula: "'Giros Anulados y Reembolsados'!E10010"
  };
  hoja_transferencias.getCell("D17").value = {
    formula: "'Giros Anulados y Reembolsados'!G10010"
  };
  hoja_transferencias.getCell("C18").value = habilitacionesAceptadas;
  hoja_transferencias.getCell("D18").value = habilitacionesEnviadas;

  hoja_transferencias.getCell("B20").value = "TOTAL";
  hoja_transferencias.getCell("B22").value = {
    formula: `IF(C22>0,"Balance a Favor","Balance Deudor")`
  };
  hoja_transferencias.getCell("B24").value = "Comision DT Giros";
  hoja_transferencias.getCell("B25").value = "Comision DT Giros pagados";
  hoja_transferencias.getCell("B26").value = "Comision DT Reembolsado";
  if (tipoArreglo == "CONTABLE") {
    hoja_transferencias.getCell("B27").value = "Comision DT Orden de pago anulado";
  }
  hoja_transferencias.getCell("B28").value = "Total Comision";

  hoja_transferencias.getCell("C20").value = {
    formula: "SUM(C7:C19)"
  };
  hoja_transferencias.getCell("D20").value = {
    formula: "SUM(D7:D19)"
  };
  hoja_transferencias.getCell("C22").value = {
    formula: "D20-C20"
  };
  hoja_transferencias.getCell("C24").value = {
    formula: "ROUNDDOWN(Giros!I10011,1)"
  };
  hoja_transferencias.getCell("C25").value = {
    formula: "ROUNDDOWN('Giros Pagados'!I10011,1)"
  };
  hoja_transferencias.getCell("C26").value = {
    formula: "('Giros Anulados y Reembolsados'!I10010) * -1"
  };
  if (tipoArreglo == "CONTABLE") {
    hoja_transferencias.getCell("C27").value = {
      formula: "('Orden de pago Anulados'!I10011) * -1"
    };
  }
  hoja_transferencias.getCell("C28").value = {
    formula: "SUM(C24:C27)"
  };
  hoja_transferencias.getCell("B20").font = {
    name: "Calibri",
    size: 12,
    bold: true,
    color: {
      argb: "FF000000"
    }
  };
  hoja_transferencias.getCell("B22").font = {
    name: "Calibri",
    size: 12,
    bold: true,
    color: {
      argb: "FF000000"
    }
  };
  hoja_transferencias.getCell("C22").font = {
    name: "Calibri",
    size: 11,
    bold: true,
    color: {
      argb: "FF000000"
    }
  };

  hoja_transferencias.getCell("B20").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FFFF8797"
    }
  };
  hoja_transferencias.getCell("B22").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FFFF8797"
    }
  };
  hoja_transferencias.getCell("B24").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF6CE06E"
    }
  };
  hoja_transferencias.getCell("B25").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF6CE06E"
    }
  };
  hoja_transferencias.getCell("B26").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FFFF4751"
    }
  };
  if (tipoArreglo == "CONTABLE") {
    hoja_transferencias.getCell("B27").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FFFF4751"
      }
    };
  }
  hoja_transferencias.getCell("B28").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF6CE06E"
    }
  };

  //CAMPOS EN GRIS
  if (saldoOficina < 0) {
    hoja_transferencias.getCell("C7").value = saldoOficina * -1;
    hoja_transferencias.getCell("D7").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FF808080"
      }
    };
  } else {
    hoja_transferencias.getCell("D7").value = saldoOficina;
    hoja_transferencias.getCell("C7").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FF808080"
      }
    };
  }

  hoja_transferencias.getCell("E7").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF808080"
    }
  };
  hoja_transferencias.getCell("D8").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF808080"
    }
  };
  hoja_transferencias.getCell("E8").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF808080"
    }
  };
  hoja_transferencias.getCell("D9").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF808080"
    }
  };
  hoja_transferencias.getCell("E9").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF808080"
    }
  };
  hoja_transferencias.getCell("F9").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF808080"
    }
  };
  hoja_transferencias.getCell("D10").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF808080"
    }
  };
  hoja_transferencias.getCell("E10").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF808080"
    }
  };
  hoja_transferencias.getCell("F10").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF808080"
    }
  };

  hoja_transferencias.getCell("C11").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF808080"
    }
  };
  hoja_transferencias.getCell("E11").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF808080"
    }
  };
  hoja_transferencias.getCell("C12").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF808080"
    }
  };
  hoja_transferencias.getCell("D12").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF808080"
    }
  };
  hoja_transferencias.getCell("F12").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF808080"
    }
  };
  hoja_transferencias.getCell("D14").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF808080"
    }
  };
  hoja_transferencias.getCell("E14").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF808080"
    }
  };
  hoja_transferencias.getCell("F14").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF808080"
    }
  };
  hoja_transferencias.getCell("C13").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF808080"
    }
  };
  hoja_transferencias.getCell("C15").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF808080"
    }
  };
  if (tipoArreglo == "CONTABLE") {
    hoja_transferencias.getCell("D15").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FFFFCFCF"
      }
    };
  } else {
    hoja_transferencias.getCell("D15").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FF808080"
      }
    };
  }
  hoja_transferencias.getCell("C16").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF808080"
    }
  };
  hoja_transferencias.getCell("E16").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF808080"
    }
  };
  hoja_transferencias.getCell("C17").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF808080"
    }
  };
  hoja_transferencias.getCell("E17").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF808080"
    }
  };
  hoja_transferencias.getCell("F17").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF808080"
    }
  };
  hoja_transferencias.getCell("E18").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF808080"
    }
  };
  hoja_transferencias.getCell("F18").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF808080"
    }
  };

  hoja_transferencias.getCell("C7").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("C8").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("C9").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("D7").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("C10").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("C14").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("D11").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("D15").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("D16").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("E12").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("D13").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("E13").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("E14").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("E15").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("C17").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("D17").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("C18").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("D18").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;

  hoja_transferencias.getCell("C20").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("C22").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("D20").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("C24").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("C25").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("C26").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("C27").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("C28").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;

  hoja_transferencias.getCell("C20").border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" }
  };
  hoja_transferencias.getCell("C22").border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" }
  };
  hoja_transferencias.getCell("D20").border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" }
  };
  hoja_transferencias.getCell("C24").border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" }
  };
  hoja_transferencias.getCell("C25").border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" }
  };
  hoja_transferencias.getCell("C26").border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" }
  };
  if (tipoArreglo == "CONTABLE") {
    hoja_transferencias.getCell("C27").border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" }
    };
  }
  hoja_transferencias.getCell("C28").border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" }
  };

  return hoja_transferencias;
}

function construirHojaTransferencias(oficina_nombre, listaTransferencias, hoja_transferencias) {
  hoja_transferencias.getCell("A1").alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true
  };
  hoja_transferencias.getCell("A2").alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true
  };
  hoja_transferencias.getCell("A3").alignment = {
    horizontal: "center",
    wrapText: true
  };
  //COMBINAR CELDAS

  hoja_transferencias.mergeCells("A1", "M1");
  hoja_transferencias.getCell("A1").value = oficina_nombre;
  hoja_transferencias.getRow(1).height = 50;
  hoja_transferencias.getCell("A1").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF548235"
    }
  };
  hoja_transferencias.getCell("A1").font = {
    name: "Calibri",
    size: 18,
    bold: true,
    color: {
      argb: "FFFFFFFF"
    }
  };

  hoja_transferencias.mergeCells("A2", "M2");
  hoja_transferencias.getCell("A2").value = "Giros";
  hoja_transferencias.getRow(2).height = 30;
  hoja_transferencias.getCell("A2").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF548235"
    }
  };
  hoja_transferencias.getCell("A2").font = {
    name: "Calibri",
    size: 12,
    bold: true,
    color: {
      argb: "FFFFFFFF"
    }
  };

  hoja_transferencias.mergeCells("A3", "D3");
  hoja_transferencias.getCell("A3").value = "Sub Totales";
  hoja_transferencias.getRow(3).height = 30;

  //ENCABEZADOS

  hoja_transferencias.getRow(4).values = [
    "Nº Documento",
    "Nº Solicitud",
    "Origen",
    "Destino",
    "Fecha y hora de solicitud",
    "Beneficiario",
    "Solicitante",
    "Importe",    
    "Derecho de transferencia",
    "Bancos",
    "Estado",
    "Comision",
    "Gastos Administrativos"
  ];

  ["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4", "J4", "K4", "L4", "M4"].map(key => {
    hoja_transferencias.getCell(key).alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true
    };
  });
  hoja_transferencias.getRow(4).height = 50;

  //IDENTIFICADORES COLUMNAS
  hoja_transferencias.columns = [
    {
      key: "St_documento_codigo",
      width: 11
    },
    {
      key: "nro_Solicitud",
      width: 8
    },
    {
      key: "oficinaorigen",
      width: 20
    },
    {
      key: "oficinadestino",
      width: 20
    },
    {
      key: "solicitud_fecha_hora",
      width: 20
    },
    {
      key: "beneficiario_razon_social",
      width: 30
    },
    {
      key: "solicitante_razon_social",
      width: 30
    },
    {
      key: "importe",
      width: 14
    },
    {
      key: "comision_dt",
      width: 14
    },
    {
      key: "comision_banco",
      width: 14
    },
    {
      key: "st_estado",
      width: 12
    },
    {
      key: "comisionorigen",
      width: 14
    },
    {
      key: "gastos_administrativos",
      width: 16
    }
  ];

  //ESTILOS FILAS 3 Y 4
  ["A3", "B3", "C3", "D3", "E3", "F3", "G3", "H3", "I3", "J3", "K3", "L3", "M3"].map(key => {
    hoja_transferencias.getCell(key).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FF548235"
      }
    };
  });

  hoja_transferencias.getCell("A3").font = {
    name: "Calibri",
    size: 12,
    bold: true,
    color: {
      argb: "FFFFFFFF"
    }
  };

  ["H3", "I3", "J3", "K3", "L3", "M3"].map(key => {
    hoja_transferencias.getCell(key).font = {
      name: "Calibri",
      size: 11,
      bold: false,
      color: {
        argb: "FFFFFFFF"
      }
    };
  });

  ["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4", "J4", "K4", "L4", "M4"].map(key => {
    hoja_transferencias.getCell(key).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FFA9D08C"
      }
    };
  });
  ["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4", "J4", "K4", "L4", "M4"].map(key => {
    hoja_transferencias.getCell(key).font = {
      name: "Calibri",
      size: 11,
      bold: true,
      color: {
        argb: "FF000000"
      }
    };
  });
  ["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4", "J4", "K4", "L4", "M4"].map(key => {
    hoja_transferencias.getCell(key).border = {
      left: {
        style: "thin",
        color: {
          argb: "FF548235"
        }
      },
      right: {
        style: "thin",
        color: {
          argb: "FF548235"
        }
      }
    };
  });

  //FORMATO DE CELDAS
  hoja_transferencias.getColumn(5).numFmt = "dd/mm/yyyy h:mm";
  hoja_transferencias.getColumn(8).numFmt = '_-"S/."* #.##0,00_-;-"S/."* #.##0,00_-;_-"S/."* "-"??_-;_-@_-';
  hoja_transferencias.getColumn(9).numFmt = '_-"S/."* #.##0,00_-;-"S/."* #.##0,00_-;_-"S/."* "-"??_-;_-@_-';
  hoja_transferencias.getColumn(10).numFmt = '_-"S/."* #.##0,00_-;-"S/."* #.##0,00_-;_-"S/."* "-"??_-;_-@_-';
  hoja_transferencias.getColumn(12).numFmt = '_-"S/."* #.##0,00_-;-"S/."* #.##0,00_-;_-"S/."* "-"??_-;_-@_-';
  hoja_transferencias.getColumn(13).numFmt = '_-"S/."* #.##0,00_-;-"S/."* #.##0,00_-;_-"S/."* "-"??_-;_-@_-';

  //AGREGAR FILAS
  hoja_transferencias.addRows(listaTransferencias);
  //FORMULAS
  hoja_transferencias.getCell("H3").value = {
    formula: "SUM(H5:H10000)"
  };
  hoja_transferencias.getCell("I3").value = {
    formula: "SUM(I5:I10000)"
  };
  hoja_transferencias.getCell("J3").value = {
    formula: "SUM(J5:J10000)"
  };
  hoja_transferencias.getCell("L3").value = {
    formula: "SUM(L5:L10000)"
  };
  hoja_transferencias.getCell("M3").value = {
    formula: "SUM(M5:M10000)"
  };
  //FILTROS
  hoja_transferencias.autoFilter = {
    from: {
      row: 4,
      column: 1
    },
    to: {
      row: 10000,
      column: 11
    }
  };

  hoja_transferencias.getCell("D10005").value = "Tipo";
  hoja_transferencias.getCell("E10005").value = "Cantidad";
  hoja_transferencias.getCell("F10005").value = "Importe";
  hoja_transferencias.getCell("G10005").value = "DT";
  hoja_transferencias.getCell("H10005").value = "Bancos";
  hoja_transferencias.getCell("I10005").value = "Comision";
  hoja_transferencias.getCell("J10005").value = "Gastos Adm";

  hoja_transferencias.getCell("D10006").value = "ARREGLO";
  hoja_transferencias.getCell("D10007").value = "PENDIENTE";
  hoja_transferencias.getCell("D10008").value = "PAGADO";
  hoja_transferencias.getCell("D10009").value = "ANULADO";
  hoja_transferencias.getCell("D10010").value = "REEMBOLSADO";

  //FORMULAS FILA CANTIDAD
  hoja_transferencias.getCell("E10006").value = {
    formula: "COUNTIF(K5:K10000,D10006)"
  };
  hoja_transferencias.getCell("E10007").value = {
    formula: "COUNTIF(K5:K10000,D10007)"
  };
  hoja_transferencias.getCell("E10008").value = {
    formula: "COUNTIF(K5:K10000,D10008)"
  };
  hoja_transferencias.getCell("E10009").value = {
    formula: "COUNTIF(K5:K10000,D10009)"
  };
  hoja_transferencias.getCell("E10010").value = {
    formula: "COUNTIF(K5:K10000,D10010)"
  };

  //FORMULAS FILA IMPORTE
  hoja_transferencias.getCell("F10006").value = {
    formula: "SUMIF(K$5:K$10000,D10006,H$5:H$10000)"
  };
  hoja_transferencias.getCell("F10007").value = {
    formula: "SUMIF(K$5:K$10000,D10007,H$5:H$10000)"
  };
  hoja_transferencias.getCell("F10008").value = {
    formula: "SUMIF(K$5:K$10000,D10008,H$5:H$10000)"
  };
  hoja_transferencias.getCell("F10009").value = {
    formula: "SUMIF(K$5:K$10000,D10009,H$5:H$10000)"
  };
  hoja_transferencias.getCell("F10010").value = {
    formula: "SUMIF(K$5:K$10000,D10010,H$5:H$10000)"
  };

  //FORMULAS FILA DT
  hoja_transferencias.getCell("G10006").value = {
    formula: "SUMIF(K$5:K$10000,D10006,I$5:I$10000)"
  };
  hoja_transferencias.getCell("G10007").value = {
    formula: "SUMIF(K$5:K$10000,D10007,I$5:I$10000)"
  };
  hoja_transferencias.getCell("G10008").value = {
    formula: "SUMIF(K$5:K$10000,D10008,I$5:I$10000)"
  };
  hoja_transferencias.getCell("G10009").value = {
    formula: "SUMIF(K$5:K$10000,D10009,I$5:I$10000)"
  };
  hoja_transferencias.getCell("G10010").value = {
    formula: "SUMIF(K$5:K$10000,D10010,I$5:I$10000)"
  };

  //FORMULAS FILA BANCOS
  hoja_transferencias.getCell("H10006").value = {
    formula: "SUMIF(K$5:K$10000,D10006,J$5:J$10000)"
  };
  hoja_transferencias.getCell("H10007").value = {
    formula: "SUMIF(K$5:K$10000,D10007,J$5:J$10000)"
  };
  hoja_transferencias.getCell("H10008").value = {
    formula: "SUMIF(K$5:K$10000,D10008,J$5:J$10000)"
  };
  hoja_transferencias.getCell("H10009").value = {
    formula: "SUMIF(K$5:K$10000,D10009,J$5:J$10000)"
  };
  hoja_transferencias.getCell("H10010").value = {
    formula: "SUMIF(K$5:K$10000,D10010,J$5:J$10000)"
  };

  //FORMULAS FILA COMISION
  hoja_transferencias.getCell("I10006").value = {
    formula: "SUMIF(K$5:K$10000,D10006,L$5:L$10000)"
  };
  hoja_transferencias.getCell("I10007").value = {
    formula: "SUMIF(K$5:K$10000,D10007,L$5:L$10000)"
  };
  hoja_transferencias.getCell("I10008").value = {
    formula: "SUMIF(K$5:K$10000,D10008,L$5:L$10000)"
  };
  hoja_transferencias.getCell("I10009").value = {
    formula: "SUMIF(K$5:K$10000,D10009,L$5:L$10000)"
  };
  hoja_transferencias.getCell("I10010").value = {
    formula: "SUMIF(K$5:K$10000,D10010,L$5:L$10000)"
  };

  //FORMULAS FILA GASTOS ADMINISTRATIVOS
  hoja_transferencias.getCell("J10006").value = {
    formula: "SUMIF(K$5:K$10000,D10006,M$5:M$10000)"
  };
  hoja_transferencias.getCell("J10007").value = {
    formula: "SUMIF(K$5:K$10000,D10007,M$5:M$10000)"
  };
  hoja_transferencias.getCell("J10008").value = {
    formula: "SUMIF(K$5:K$10000,D10008,M$5:M$10000)"
  };
  hoja_transferencias.getCell("J10009").value = {
    formula: "SUMIF(K$5:K$10000,D10009,M$5:M$10000)"
  };
  hoja_transferencias.getCell("J10010").value = {
    formula: "SUMIF(K$5:K$10000,D10010,M$5:M$10000)"
  };

  //FORMULAS DE SUMAS
  hoja_transferencias.getCell("E10011").value = {
    formula: "SUM(E10006:E10010)"
  };
  hoja_transferencias.getCell("F10011").value = {
    formula: "SUM(F10006:F10010)"
  };
  hoja_transferencias.getCell("G10011").value = {
    formula: "SUM(G10006:G10010)"
  };
  hoja_transferencias.getCell("H10011").value = {
    formula: "SUM(H10006:H10010)"
  };
  hoja_transferencias.getCell("I10011").value = {
    formula: "SUM(I10006:I10010)"
  };
  hoja_transferencias.getCell("J10011").value = {
    formula: "SUM(J10006:J10010)"
  };

  //FORMATO DE CELDAS
  hoja_transferencias.getCell("E10006").numFmt = "0";
  hoja_transferencias.getCell("E10007").numFmt = "0";
  hoja_transferencias.getCell("E10008").numFmt = "0";
  hoja_transferencias.getCell("E10009").numFmt = "0";
  hoja_transferencias.getCell("E10010").numFmt = "0";
  hoja_transferencias.getCell("E10011").numFmt = "0";

  hoja_transferencias.getCell("F10006").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("F10007").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("F10008").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("F10009").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("F10010").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("F10011").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;

  hoja_transferencias.getCell("G10006").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("G10007").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("G10008").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("G10009").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("G10010").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("G10011").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;

  hoja_transferencias.getCell("H10006").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("H10007").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("H10008").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("H10009").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("H10010").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("H10011").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;

  hoja_transferencias.getCell("I10006").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("I10007").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("I10008").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("I10009").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("I10010").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("I10011").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;

  hoja_transferencias.getCell("J10006").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("J10007").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("J10008").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("J10009").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("J10010").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_transferencias.getCell("J10011").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;

  return hoja_transferencias;
}

function construirHojaOrdenpagoReal(oficina_nombre, listaOrdenesPago, hoja_orden_pago) {
  hoja_orden_pago.getCell("A1").alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true
  };
  hoja_orden_pago.getCell("A2").alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true
  };
  hoja_orden_pago.getCell("A3").alignment = {
    horizontal: "center",
    wrapText: true
  };
  //COMBINAR CELDAS

  hoja_orden_pago.mergeCells("A1", "M1");
  hoja_orden_pago.getCell("A1").value = oficina_nombre;
  hoja_orden_pago.getRow(1).height = 50;
  hoja_orden_pago.getCell("A1").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF305496"
    }
  };
  hoja_orden_pago.getCell("A1").font = {
    name: "Calibri",
    size: 18,
    bold: true,
    color: {
      argb: "FFFFFFFF"
    }
  };

  hoja_orden_pago.mergeCells("A2", "M2");
  hoja_orden_pago.getCell("A2").value = "Giros";
  hoja_orden_pago.getRow(2).height = 30;
  hoja_orden_pago.getCell("A2").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF305496"
    }
  };
  hoja_orden_pago.getCell("A2").font = {
    name: "Calibri",
    size: 12,
    bold: true,
    color: {
      argb: "FFFFFFFF"
    }
  };

  hoja_orden_pago.mergeCells("A3", "D3");
  hoja_orden_pago.getCell("A3").value = "Sub Totales";
  hoja_orden_pago.getRow(3).height = 30;

  //ENCABEZADOS

  hoja_orden_pago.getRow(4).values = [
    "Nº Documento",
    "Nº Solicitud",
    "Origen",
    "Destino",
    "Fecha y hora de solicitud",
    "Fecha y hora de pago",
    "Beneficiario",
    "Solicitante",
    "Importe",
    "Derecho de transferencia",
    "Bancos",
    "Estado",
    "Comision"
  ];

  ["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4", "J4", "K4", "L4", "M4"].map(key => {
    hoja_orden_pago.getCell(key).alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true
    };
  });

  hoja_orden_pago.getRow(4).height = 50;

  //IDENTIFICADORES COLUMNAS
  hoja_orden_pago.columns = [
    {
      key: "St_documento_codigo",
      width: 11
    },
    {
      key: "nro_Solicitud",
      width: 8
    },
    {
      key: "oficinaorigen",
      width: 20
    },
    {
      key: "oficinadestino",
      width: 20
    },
    {
      key: "solicitud_fecha_hora",
      width: 20
    },
    {
      key: "op_fecha_hora",
      width: 20
    },
    {
      key: "beneficiario_razon_social",
      width: 30
    },
    {
      key: "solicitante_razon_social",
      width: 30
    },
    {
      key: "importe",
      width: 14
    },
    {
      key: "comision_dt",
      width: 14
    },
    {
      key: "comision_banco",
      width: 14
    },
    {
      key: "st_estado",
      width: 12
    },
    {
      key: "comisiondestino",
      width: 14
    }
  ];

  hoja_orden_pago.getCell("A3").font = {
    name: "Calibri",
    size: 12,
    bold: true,
    color: {
      argb: "FFFFFFFF"
    }
  };

  ["H3", "I3", "J3", "K3","L3"].map(key => {
    hoja_orden_pago.getCell(key).font = {
      name: "Calibri",
      size: 11,
      bold: false,
      color: {
        argb: "FFFFFFFF"
      }
    };
  });
  //ESTILOS FILAS 3 Y 4
  ["A3", "B3", "C3", "D3", "E3", "F3", "G3", "H3", "I3", "J3", "K3", "L3", "M3"].map(key => {
    hoja_orden_pago.getCell(key).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FF305496"
      }
    };
  });

  ["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4", "J4", "K4", "L4", "M4"].map(key => {
    hoja_orden_pago.getCell(key).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FF96C2E6"
      }
    };
  });

  ["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4", "J4", "K4", "L4", "M4"].map(key => {
    hoja_orden_pago.getCell(key).font = {
      name: "Calibri",
      size: 11,
      bold: true,
      color: {
        argb: "FF000000"
      }
    };
  });

  ["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4", "J4", "K4", "L4", "M4"].map(key => {
    hoja_orden_pago.getCell(key).border = {
      left: {
        style: "thin",
        color: {
          argb: "FF548235"
        }
      },
      right: {
        style: "thin",
        color: {
          argb: "FF548235"
        }
      }
    };
  });

  //FORMATO DE CELDAS
  hoja_orden_pago.getColumn(5).numFmt = "dd/mm/yyyy h:mm";
  hoja_orden_pago.getColumn(6).numFmt = "dd/mm/yyyy h:mm";
  hoja_orden_pago.getColumn(9).numFmt = '_-"S/."* #,##0.00_-;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';
  hoja_orden_pago.getColumn(10).numFmt = '_-"S/."* #,##0.00_-;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';
  hoja_orden_pago.getColumn(11).numFmt = '_-"S/."* #,##0.00_-;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';
  hoja_orden_pago.getColumn(13).numFmt = '_-"S/."* #,##0.00_-;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';

  //AGREGAR FILAS
  hoja_orden_pago.addRows(listaOrdenesPago);
  //FORMULAS
  hoja_orden_pago.getCell("I3").value = {
    formula: "SUM(I5:I10000)"
  };
  hoja_orden_pago.getCell("J3").value = {
    formula: "SUM(J5:J10000)"
  };
  hoja_orden_pago.getCell("K3").value = {
    formula: "SUM(K5:K10000)"
  };
  hoja_orden_pago.getCell("M3").value = {
    formula: "SUM(M5:M10000)"
  };
  //FILTROS
  hoja_orden_pago.autoFilter = {
    from: {
      row: 4,
      column: 1
    },
    to: {
      row: 10000,
      column: 11
    }
  };

  hoja_orden_pago.getCell("D10005").value = "Tipo";
  hoja_orden_pago.getCell("E10005").value = "Cantidad";
  hoja_orden_pago.getCell("F10005").value = "Importe";
  hoja_orden_pago.getCell("G10005").value = "DT";
  hoja_orden_pago.getCell("H10005").value = "Bancos";
  hoja_orden_pago.getCell("I10005").value = "Comision";

  hoja_orden_pago.getCell("D10006").value = "ARREGLO";
  hoja_orden_pago.getCell("D10007").value = "PENDIENTE";
  hoja_orden_pago.getCell("D10008").value = "PAGADO";
  hoja_orden_pago.getCell("D10009").value = "ANULADO";
  hoja_orden_pago.getCell("D10010").value = "REEMBOLSADO";

  //FORMULAS FILA CANTIDAD
  hoja_orden_pago.getCell("E10006").value = {
    formula: "COUNTIF(L5:L10000,D10006)"
  };
  hoja_orden_pago.getCell("E10007").value = {
    formula: "COUNTIF(L5:L10000,D10007)"
  };
  hoja_orden_pago.getCell("E10008").value = {
    formula: "COUNTIF(L5:L10000,D10008)"
  };
  hoja_orden_pago.getCell("E10009").value = {
    formula: "COUNTIF(L5:L10000,D10009)"
  };
  hoja_orden_pago.getCell("E10010").value = {
    formula: "COUNTIF(L5:L10000,D10010)"
  };

  //FORMULAS FILA IMPORTE
  hoja_orden_pago.getCell("F10006").value = {
    formula: "SUMIF(L$5:L$10000,D10006,I$5:I$10000)"
  };
  hoja_orden_pago.getCell("F10007").value = {
    formula: "SUMIF(L$5:L$10000,D10007,I$5:I$10000)"
  };
  hoja_orden_pago.getCell("F10008").value = {
    formula: "SUMIF(L$5:L$10000,D10008,I$5:I$10000)"
  };
  hoja_orden_pago.getCell("F10009").value = {
    formula: "SUMIF(L$5:L$10000,D10009,I$5:I$10000)"
  };
  hoja_orden_pago.getCell("F10010").value = {
    formula: "SUMIF(L$5:L$10000,D10010,I$5:I$10000)"
  };

  //FORMULAS FILA DT
  hoja_orden_pago.getCell("G10006").value = {
    formula: "SUMIF(L$5:L$10000,D10006,J$5:J$10000)"
  };
  hoja_orden_pago.getCell("G10007").value = {
    formula: "SUMIF(L$5:L$10000,D10007,J$5:J$10000)"
  };
  hoja_orden_pago.getCell("G10008").value = {
    formula: "SUMIF(L$5:L$10000,D10008,J$5:J$10000)"
  };
  hoja_orden_pago.getCell("G10009").value = {
    formula: "SUMIF(L$5:L$10000,D10009,J$5:J$10000)"
  };
  hoja_orden_pago.getCell("G10010").value = {
    formula: "SUMIF(L$5:L$10000,D10010,J$5:J$10000)"
  };

  //FORMULAS FILA BANCOS
  hoja_orden_pago.getCell("H10006").value = {
    formula: "SUMIF(L$5:L$10000,D10006,K$5:K$10000)"
  };
  hoja_orden_pago.getCell("H10007").value = {
    formula: "SUMIF(L$5:L$10000,D10007,K$5:K$10000)"
  };
  hoja_orden_pago.getCell("H10008").value = {
    formula: "SUMIF(L$5:L$10000,D10008,K$5:K$10000)"
  };
  hoja_orden_pago.getCell("H10009").value = {
    formula: "SUMIF(L$5:L$10000,D10009,K$5:K$10000)"
  };
  hoja_orden_pago.getCell("H10010").value = {
    formula: "SUMIF(L$5:L$10000,D10010,K$5:K$10000)"
  };

  //FORMULAS FILA COMISION
  hoja_orden_pago.getCell("I10006").value = {
    formula: "SUMIF(L$5:L$10000,D10006,M$5:M$10000)"
  };
  hoja_orden_pago.getCell("I10007").value = {
    formula: "SUMIF(L$5:L$10000,D10007,M$5:M$10000)"
  };
  hoja_orden_pago.getCell("I10008").value = {
    formula: "SUMIF(L$5:L$10000,D10008,M$5:M$10000)"
  };
  hoja_orden_pago.getCell("I10009").value = {
    formula: "SUMIF(L$5:L$10000,D10009,M$5:M$10000)"
  };
  hoja_orden_pago.getCell("I10010").value = {
    formula: "SUMIF(L$5:L$10000,D10010,M$5:M$10000)"
  };

  //FORMULAS DE SUMAS
  hoja_orden_pago.getCell("E10011").value = {
    formula: "SUM(E10006:E10010)"
  };
  hoja_orden_pago.getCell("F10011").value = {
    formula: "SUM(F10006:F10010)"
  };
  hoja_orden_pago.getCell("G10011").value = {
    formula: "SUM(G10006:G10010)"
  };
  hoja_orden_pago.getCell("H10011").value = {
    formula: "SUM(H10006:H10010)"
  };
  hoja_orden_pago.getCell("I10011").value = {
    formula: "SUM(I10006:I10010)"
  };

  //FORMATO DE CELDAS
  hoja_orden_pago.getCell("E10006").numFmt = "0";
  hoja_orden_pago.getCell("E10007").numFmt = "0";
  hoja_orden_pago.getCell("E10008").numFmt = "0";
  hoja_orden_pago.getCell("E10009").numFmt = "0";
  hoja_orden_pago.getCell("E10010").numFmt = "0";
  hoja_orden_pago.getCell("E10011").numFmt = "0";

  hoja_orden_pago.getCell("F10006").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_orden_pago.getCell("F10007").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_orden_pago.getCell("F10008").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_orden_pago.getCell("F10009").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_orden_pago.getCell("F10010").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_orden_pago.getCell("F10011").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;

  hoja_orden_pago.getCell("G10006").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_orden_pago.getCell("G10007").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_orden_pago.getCell("G10008").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_orden_pago.getCell("G10009").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_orden_pago.getCell("G10010").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_orden_pago.getCell("G10011").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;

  hoja_orden_pago.getCell("H10006").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_orden_pago.getCell("H10007").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_orden_pago.getCell("H10008").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_orden_pago.getCell("H10009").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_orden_pago.getCell("H10010").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_orden_pago.getCell("H10011").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;

  hoja_orden_pago.getCell("I10006").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_orden_pago.getCell("I10007").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_orden_pago.getCell("I10008").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_orden_pago.getCell("I10009").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_orden_pago.getCell("I10010").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_orden_pago.getCell("I10011").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;

  return hoja_orden_pago;
}

function construirHojaOrdenpagoContable(oficina_nombre, listaOrdenesPago, hoja_orden_pago) {
  hoja_orden_pago.getCell("A1").alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true
  };
  hoja_orden_pago.getCell("A2").alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true
  };
  hoja_orden_pago.getCell("A3").alignment = {
    horizontal: "center",
    wrapText: true
  };
  //COMBINAR CELDAS

  hoja_orden_pago.mergeCells("A1", "L1");
  hoja_orden_pago.getCell("A1").value = oficina_nombre;
  hoja_orden_pago.getRow(1).height = 50;
  hoja_orden_pago.getCell("A1").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF305496"
    }
  };
  hoja_orden_pago.getCell("A1").font = {
    name: "Calibri",
    size: 18,
    bold: true,
    color: {
      argb: "FFFFFFFF"
    }
  };

  hoja_orden_pago.mergeCells("A2", "L2");
  hoja_orden_pago.getCell("A2").value = "Giros";
  hoja_orden_pago.getRow(2).height = 30;
  hoja_orden_pago.getCell("A2").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF305496"
    }
  };
  hoja_orden_pago.getCell("A2").font = {
    name: "Calibri",
    size: 12,
    bold: true,
    color: {
      argb: "FFFFFFFF"
    }
  };

  hoja_orden_pago.mergeCells("A3", "D3");
  hoja_orden_pago.getCell("A3").value = "Sub Totales";
  hoja_orden_pago.getRow(3).height = 30;

  //ENCABEZADOS

  hoja_orden_pago.getRow(4).values = [
    "Nº Documento",
    "Nº Solicitud",
    "Origen",
    "Destino",
    "Fecha y hora de solicitud",
    "Beneficiario",
    "Solicitante",
    "Importe",
    "Derecho de transferencia",
    "Bancos",
    "Estado",
    "Comision"
  ];

  ["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4", "J4", "K4", "L4"].map(key => {
    hoja_orden_pago.getCell(key).alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true
    };
  });

  hoja_orden_pago.getRow(4).height = 50;

  //IDENTIFICADORES COLUMNAS
  hoja_orden_pago.columns = [
    {
      key: "St_documento_codigo",
      width: 11
    },
    {
      key: "nro_Solicitud",
      width: 8
    },
    {
      key: "oficinaorigen",
      width: 20
    },
    {
      key: "oficinadestino",
      width: 20
    },
    {
      key: "solicitud_fecha_hora",
      width: 20
    },
    {
      key: "beneficiario_razon_social",
      width: 30
    },
    {
      key: "solicitante_razon_social",
      width: 30
    },
    {
      key: "importe",
      width: 14
    },
    {
      key: "comision_dt",
      width: 14
    },
    {
      key: "comision_banco",
      width: 14
    },
    {
      key: "st_estado",
      width: 12
    },
    {
      key: "comisiondestino",
      width: 14
    }
  ];

  hoja_orden_pago.getCell("A3").font = {
    name: "Calibri",
    size: 12,
    bold: true,
    color: {
      argb: "FFFFFFFF"
    }
  };

  ["H3", "I3", "J3", "K3", "L3"].map(key => {
    hoja_orden_pago.getCell(key).font = {
      name: "Calibri",
      size: 11,
      bold: false,
      color: {
        argb: "FFFFFFFF"
      }
    };
  });
  //ESTILOS FILAS 3 Y 4
  ["A3", "B3", "C3", "D3", "E3", "F3", "G3", "H3", "I3", "J3", "K3", "L3"].map(key => {
    hoja_orden_pago.getCell(key).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FF305496"
      }
    };
  });

  ["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4", "J4", "K4", "L4"].map(key => {
    hoja_orden_pago.getCell(key).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FF96C2E6"
      }
    };
  });

  ["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4", "J4", "K4", "L4"].map(key => {
    hoja_orden_pago.getCell(key).font = {
      name: "Calibri",
      size: 11,
      bold: true,
      color: {
        argb: "FF000000"
      }
    };
  });
  ["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4", "J4", "K4", "L4"].map(key => {
    hoja_orden_pago.getCell(key).border = {
      left: {
        style: "thin",
        color: {
          argb: "FF548235"
        }
      },
      right: {
        style: "thin",
        color: {
          argb: "FF548235"
        }
      }
    };
  });

  //FORMATO DE CELDAS
  hoja_orden_pago.getColumn(5).numFmt = "dd/mm/yyyy h:mm";
  hoja_orden_pago.getColumn(8).numFmt = '_-"S/."* #,##0.00_-;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';
  hoja_orden_pago.getColumn(9).numFmt = '_-"S/."* #,##0.00_-;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';
  hoja_orden_pago.getColumn(10).numFmt = '_-"S/."* #,##0.00_-;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';
  hoja_orden_pago.getColumn(12).numFmt = '_-"S/."* #,##0.00_-;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';

  //AGREGAR FILAS
  hoja_orden_pago.addRows(listaOrdenesPago);
  //FORMULAS
  hoja_orden_pago.getCell("H3").value = {
    formula: "SUM(H5:H10000)"
  };
  hoja_orden_pago.getCell("I3").value = {
    formula: "SUM(I5:I10000)"
  };
  hoja_orden_pago.getCell("J3").value = {
    formula: "SUM(J5:J10000)"
  };
  hoja_orden_pago.getCell("L3").value = {
    formula: "SUM(L5:L10000)"
  };
  //FILTROS
  hoja_orden_pago.autoFilter = {
    from: {
      row: 4,
      column: 1
    },
    to: {
      row: 10000,
      column: 11
    }
  };

  hoja_orden_pago.getCell("D10005").value = "Tipo";
  hoja_orden_pago.getCell("E10005").value = "Cantidad";
  hoja_orden_pago.getCell("F10005").value = "Importe";
  hoja_orden_pago.getCell("G10005").value = "DT";
  hoja_orden_pago.getCell("H10005").value = "Bancos";
  hoja_orden_pago.getCell("I10005").value = "Comision";

  hoja_orden_pago.getCell("D10006").value = "ARREGLO";
  hoja_orden_pago.getCell("D10007").value = "PENDIENTE";
  hoja_orden_pago.getCell("D10008").value = "PAGADO";
  hoja_orden_pago.getCell("D10009").value = "ANULADO";
  hoja_orden_pago.getCell("D10010").value = "REEMBOLSADO";

  //FORMULAS FILA CANTIDAD
  hoja_orden_pago.getCell("E10006").value = {
    formula: "COUNTIF(K5:K10000,D10006)"
  };
  hoja_orden_pago.getCell("E10007").value = {
    formula: "COUNTIF(K5:K10000,D10007)"
  };
  hoja_orden_pago.getCell("E10008").value = {
    formula: "COUNTIF(K5:K10000,D10008)"
  };
  hoja_orden_pago.getCell("E10009").value = {
    formula: "COUNTIF(K5:K10000,D10009)"
  };
  hoja_orden_pago.getCell("E10010").value = {
    formula: "COUNTIF(K5:K10000,D10010)"
  };

  //FORMULAS FILA IMPORTE
  hoja_orden_pago.getCell("F10006").value = {
    formula: "SUMIF(K$5:K$10000,D10006,H$5:H$10000)"
  };
  hoja_orden_pago.getCell("F10007").value = {
    formula: "SUMIF(K$5:K$10000,D10007,H$5:H$10000)"
  };
  hoja_orden_pago.getCell("F10008").value = {
    formula: "SUMIF(K$5:K$10000,D10008,H$5:H$10000)"
  };
  hoja_orden_pago.getCell("F10009").value = {
    formula: "SUMIF(K$5:K$10000,D10009,H$5:H$10000)"
  };
  hoja_orden_pago.getCell("F10010").value = {
    formula: "SUMIF(K$5:K$10000,D10010,H$5:H$10000)"
  };

  //FORMULAS FILA DT
  hoja_orden_pago.getCell("G10006").value = {
    formula: "SUMIF(K$5:K$10000,D10006,I$5:I$10000)"
  };
  hoja_orden_pago.getCell("G10007").value = {
    formula: "SUMIF(K$5:K$10000,D10007,I$5:I$10000)"
  };
  hoja_orden_pago.getCell("G10008").value = {
    formula: "SUMIF(K$5:K$10000,D10008,I$5:I$10000)"
  };
  hoja_orden_pago.getCell("G10009").value = {
    formula: "SUMIF(K$5:K$10000,D10009,I$5:I$10000)"
  };
  hoja_orden_pago.getCell("G10010").value = {
    formula: "SUMIF(K$5:K$10000,D10010,I$5:I$10000)"
  };

  //FORMULAS FILA BANCOS
  hoja_orden_pago.getCell("H10006").value = {
    formula: "SUMIF(K$5:K$10000,D10006,J$5:J$10000)"
  };
  hoja_orden_pago.getCell("H10007").value = {
    formula: "SUMIF(K$5:K$10000,D10007,J$5:J$10000)"
  };
  hoja_orden_pago.getCell("H10008").value = {
    formula: "SUMIF(K$5:K$10000,D10008,J$5:J$10000)"
  };
  hoja_orden_pago.getCell("H10009").value = {
    formula: "SUMIF(K$5:K$10000,D10009,J$5:J$10000)"
  };
  hoja_orden_pago.getCell("H10010").value = {
    formula: "SUMIF(K$5:K$10000,D10010,J$5:J$10000)"
  };

  //FORMULAS FILA COMISION
  hoja_orden_pago.getCell("I10006").value = {
    formula: "SUMIF(K$5:K$10000,D10006,L$5:L$10000)"
  };
  hoja_orden_pago.getCell("I10007").value = {
    formula: "SUMIF(K$5:K$10000,D10007,L$5:L$10000)"
  };
  hoja_orden_pago.getCell("I10008").value = {
    formula: "SUMIF(K$5:K$10000,D10008,L$5:L$10000)"
  };
  hoja_orden_pago.getCell("I10009").value = {
    formula: "SUMIF(K$5:K$10000,D10009,L$5:L$10000)"
  };
  hoja_orden_pago.getCell("I10010").value = {
    formula: "SUMIF(K$5:K$10000,D10010,L$5:L$10000)"
  };

  //FORMULAS DE SUMAS
  hoja_orden_pago.getCell("E10011").value = {
    formula: "SUM(E10006:E10010)"
  };
  hoja_orden_pago.getCell("F10011").value = {
    formula: "SUM(F10006:F10010)"
  };
  hoja_orden_pago.getCell("G10011").value = {
    formula: "SUM(G10006:G10010)"
  };
  hoja_orden_pago.getCell("H10011").value = {
    formula: "SUM(H10006:H10010)"
  };
  hoja_orden_pago.getCell("I10011").value = {
    formula: "SUM(I10006:I10010)"
  };

  //FORMATO DE CELDAS
  hoja_orden_pago.getCell("E10006").numFmt = "0";
  hoja_orden_pago.getCell("E10007").numFmt = "0";
  hoja_orden_pago.getCell("E10008").numFmt = "0";
  hoja_orden_pago.getCell("E10009").numFmt = "0";
  hoja_orden_pago.getCell("E10010").numFmt = "0";
  hoja_orden_pago.getCell("E10011").numFmt = "0";

  hoja_orden_pago.getCell("F10006").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_orden_pago.getCell("F10007").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_orden_pago.getCell("F10008").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_orden_pago.getCell("F10009").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_orden_pago.getCell("F10010").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_orden_pago.getCell("F10011").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;

  hoja_orden_pago.getCell("G10006").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_orden_pago.getCell("G10007").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_orden_pago.getCell("G10008").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_orden_pago.getCell("G10009").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_orden_pago.getCell("G10010").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_orden_pago.getCell("G10011").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;

  hoja_orden_pago.getCell("H10006").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_orden_pago.getCell("H10007").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_orden_pago.getCell("H10008").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_orden_pago.getCell("H10009").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_orden_pago.getCell("H10010").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_orden_pago.getCell("H10011").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;

  hoja_orden_pago.getCell("I10006").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_orden_pago.getCell("I10007").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_orden_pago.getCell("I10008").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_orden_pago.getCell("I10009").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_orden_pago.getCell("I10010").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_orden_pago.getCell("I10011").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;

  return hoja_orden_pago;
}

function construirHojaReembolsosGiros(oficina_nombre, listaReembolsos, hoja_descuentos) {
  hoja_descuentos.getCell("A1").alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true
  };
  hoja_descuentos.getCell("A2").alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true
  };
  hoja_descuentos.getCell("A3").alignment = {
    horizontal: "center",
    wrapText: true
  };
  //COMBINAR CELDAS

  hoja_descuentos.mergeCells("A1", "L1");
  hoja_descuentos.getCell("A1").value = oficina_nombre;
  hoja_descuentos.getRow(1).height = 50;
  hoja_descuentos.getCell("A1").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF963030"
    }
  };
  hoja_descuentos.getCell("A1").font = {
    name: "Calibri",
    size: 18,
    bold: true,
    color: {
      argb: "FFFFFFFF"
    }
  };

  hoja_descuentos.mergeCells("A2", "L2");
  hoja_descuentos.getCell("A2").value = "Giros";
  hoja_descuentos.getRow(2).height = 30;
  hoja_descuentos.getCell("A2").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF963030"
    }
  };
  hoja_descuentos.getCell("A2").font = {
    name: "Calibri",
    size: 12,
    bold: true,
    color: {
      argb: "FFFFFFFF"
    }
  };

  hoja_descuentos.mergeCells("A3", "D3");
  hoja_descuentos.getCell("A3").value = "Sub Totales";
  hoja_descuentos.getRow(3).height = 30;

  //ENCABEZADOS

  hoja_descuentos.getRow(4).values = [
    "Nº Documento",
    "Nº Solicitud",
    "Origen",
    "Destino",
    "Fecha y hora de solicitud",
    "Beneficiario",
    "Solicitante",
    "Importe",
    "Derecho de transferencia",
    "Bancos",
    "Estado",
    "Comision"
  ];

  ["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4", "J4", "K4", "L4"].map(key => {
    hoja_descuentos.getCell(key).alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true
    };
  });

  hoja_descuentos.getRow(4).height = 50;

  //IDENTIFICADORES COLUMNAS
  hoja_descuentos.columns = [
    {
      key: "St_documento_codigo",
      width: 11
    },
    {
      key: "nro_Solicitud",
      width: 8
    },
    {
      key: "oficinaorigen",
      width: 20
    },
    {
      key: "oficinadestino",
      width: 20
    },
    {
      key: "solicitud_fecha_hora",
      width: 20
    },
    {
      key: "beneficiario_razon_social",
      width: 30
    },
    {
      key: "solicitante_razon_social",
      width: 30
    },
    {
      key: "importe",
      width: 14
    },
    {
      key: "comision_dt",
      width: 14
    },
    {
      key: "comision_banco",
      width: 14
    },
    {
      key: "st_estado",
      width: 12
    },
    {
      key: "comisionorigen",
      width: 14
    }
  ];

  hoja_descuentos.getCell("A3").font = {
    name: "Calibri",
    size: 12,
    bold: true,
    color: {
      argb: "FFFFFFFF"
    }
  };

  ["H3", "I3", "J3", "K3", "L3"].map(key => {
    hoja_descuentos.getCell(key).font = {
      name: "Calibri",
      size: 11,
      bold: false,
      color: {
        argb: "FFFFFFFF"
      }
    };
  });
  //ESTILOS FILAS 3 Y 4
  ["A3", "B3", "C3", "D3", "E3", "F3", "G3", "H3", "I3", "J3", "K3", "L3"].map(key => {
    hoja_descuentos.getCell(key).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FF963030"
      }
    };
  });

  ["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4", "J4", "K4", "L4"].map(key => {
    hoja_descuentos.getCell(key).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FFE69696"
      }
    };
  });

  ["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4", "J4", "K4", "L4"].map(key => {
    hoja_descuentos.getCell(key).font = {
      name: "Calibri",
      size: 11,
      bold: true,
      color: {
        argb: "FF000000"
      }
    };
  });
  ["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4", "J4", "K4", "L4"].map(key => {
    hoja_descuentos.getCell(key).border = {
      left: {
        style: "thin",
        color: {
          argb: "FF548235"
        }
      },
      right: {
        style: "thin",
        color: {
          argb: "FF548235"
        }
      }
    };
  });

  //FORMATO DE CELDAS
  hoja_descuentos.getColumn(5).numFmt = "dd/mm/yyyy h:mm";
  hoja_descuentos.getColumn(8).numFmt = '_-"S/."* #,##0.00_-;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';
  hoja_descuentos.getColumn(9).numFmt = '_-"S/."* #,##0.00_-;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';
  hoja_descuentos.getColumn(10).numFmt = '_-"S/."* #,##0.00_-;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';
  hoja_descuentos.getColumn(12).numFmt = '_-"S/."* #,##0.00_-;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';

  //AGREGAR FILAS
  hoja_descuentos.addRows(listaReembolsos);
  //FORMULAS
  hoja_descuentos.getCell("H3").value = {
    formula: "SUM(H5:H10000)"
  };
  hoja_descuentos.getCell("I3").value = {
    formula: "SUM(I5:I10000)"
  };
  hoja_descuentos.getCell("J3").value = {
    formula: "SUM(J5:J10000)"
  };
  hoja_descuentos.getCell("L3").value = {
    formula: "SUM(L5:L10000)"
  };
  //FILTROS
  hoja_descuentos.autoFilter = {
    from: {
      row: 4,
      column: 1
    },
    to: {
      row: 10000,
      column: 11
    }
  };

  hoja_descuentos.getCell("D10005").value = "Tipo";
  hoja_descuentos.getCell("E10005").value = "Cantidad";
  hoja_descuentos.getCell("F10005").value = "Importe";
  hoja_descuentos.getCell("G10005").value = "DT";
  hoja_descuentos.getCell("H10005").value = "Bancos";
  hoja_descuentos.getCell("I10005").value = "Comision";

  hoja_descuentos.getCell("D10006").value = "ARREGLO";
  hoja_descuentos.getCell("D10007").value = "PENDIENTE";
  hoja_descuentos.getCell("D10008").value = "PAGADO";
  hoja_descuentos.getCell("D10009").value = "ANULADO";
  hoja_descuentos.getCell("D10010").value = "REEMBOLSADO";

  //FORMULAS FILA CANTIDAD
  hoja_descuentos.getCell("E10006").value = {
    formula: "COUNTIF(K5:K10000,D10006)"
  };
  hoja_descuentos.getCell("E10007").value = {
    formula: "COUNTIF(K5:K10000,D10007)"
  };
  hoja_descuentos.getCell("E10008").value = {
    formula: "COUNTIF(K5:K10000,D10008)"
  };
  hoja_descuentos.getCell("E10009").value = {
    formula: "COUNTIF(K5:K10000,D10009)"
  };
  hoja_descuentos.getCell("E10010").value = {
    formula: "COUNTIF(K5:K10000,D10010)"
  };

  //FORMULAS FILA IMPORTE
  hoja_descuentos.getCell("F10006").value = {
    formula: "SUMIF(K$5:K$10000,D10006,H$5:H$10000)"
  };
  hoja_descuentos.getCell("F10007").value = {
    formula: "SUMIF(K$5:K$10000,D10007,H$5:H$10000)"
  };
  hoja_descuentos.getCell("F10008").value = {
    formula: "SUMIF(K$5:K$10000,D10008,H$5:H$10000)"
  };
  hoja_descuentos.getCell("F10009").value = {
    formula: "SUMIF(K$5:K$10000,D10009,H$5:H$10000)"
  };
  hoja_descuentos.getCell("F10010").value = {
    formula: "SUMIF(K$5:K$10000,D10010,H$5:H$10000)"
  };

  //FORMULAS FILA DT
  hoja_descuentos.getCell("G10006").value = {
    formula: "SUMIF(K$5:K$10000,D10006,I$5:I$10000)"
  };
  hoja_descuentos.getCell("G10007").value = {
    formula: "SUMIF(K$5:K$10000,D10007,I$5:I$10000)"
  };
  hoja_descuentos.getCell("G10008").value = {
    formula: "SUMIF(K$5:K$10000,D10008,I$5:I$10000)"
  };
  hoja_descuentos.getCell("G10009").value = {
    formula: "SUMIF(K$5:K$10000,D10009,I$5:I$10000)"
  };
  hoja_descuentos.getCell("G10010").value = {
    formula: "SUMIF(K$5:K$10000,D10010,I$5:I$10000)"
  };

  //FORMULAS FILA BANCOS
  hoja_descuentos.getCell("H10006").value = {
    formula: "SUMIF(K$5:K$10000,D10006,J$5:J$10000)"
  };
  hoja_descuentos.getCell("H10007").value = {
    formula: "SUMIF(K$5:K$10000,D10007,J$5:J$10000)"
  };
  hoja_descuentos.getCell("H10008").value = {
    formula: "SUMIF(K$5:K$10000,D10008,J$5:J$10000)"
  };
  hoja_descuentos.getCell("H10009").value = {
    formula: "SUMIF(K$5:K$10000,D10009,J$5:J$10000)"
  };
  hoja_descuentos.getCell("H10010").value = {
    formula: "SUMIF(K$5:K$10000,D10010,J$5:J$10000)"
  };

  //FORMULAS FILA COMISION
  hoja_descuentos.getCell("I10006").value = {
    formula: "SUMIF(K$5:K$10000,D10006,L$5:L$10000)"
  };
  hoja_descuentos.getCell("I10007").value = {
    formula: "SUMIF(K$5:K$10000,D10007,L$5:L$10000)"
  };
  hoja_descuentos.getCell("I10008").value = {
    formula: "SUMIF(K$5:K$10000,D10008,L$5:L$10000)"
  };
  hoja_descuentos.getCell("I10009").value = {
    formula: "SUMIF(K$5:K$10000,D10009,L$5:L$10000)"
  };
  hoja_descuentos.getCell("I10010").value = {
    formula: "SUMIF(K$5:K$10000,D10010,L$5:L$10000)"
  };

  //FORMULAS DE SUMAS
  hoja_descuentos.getCell("E10011").value = {
    formula: "SUM(E10006:E10010)"
  };
  hoja_descuentos.getCell("F10011").value = {
    formula: "SUM(F10006:F10010)"
  };
  hoja_descuentos.getCell("G10011").value = {
    formula: "SUM(G10006:G10010)"
  };
  hoja_descuentos.getCell("H10011").value = {
    formula: "SUM(H10006:H10010)"
  };
  hoja_descuentos.getCell("I10011").value = {
    formula: "SUM(I10006:I10010)"
  };

  //FORMATO DE CELDAS
  hoja_descuentos.getCell("E10006").numFmt = "0";
  hoja_descuentos.getCell("E10007").numFmt = "0";
  hoja_descuentos.getCell("E10008").numFmt = "0";
  hoja_descuentos.getCell("E10009").numFmt = "0";
  hoja_descuentos.getCell("E10010").numFmt = "0";
  hoja_descuentos.getCell("E10011").numFmt = "0";

  hoja_descuentos.getCell("F10006").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_descuentos.getCell("F10007").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_descuentos.getCell("F10008").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_descuentos.getCell("F10009").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_descuentos.getCell("F10010").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_descuentos.getCell("F10011").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;

  hoja_descuentos.getCell("G10006").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_descuentos.getCell("G10007").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_descuentos.getCell("G10008").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_descuentos.getCell("G10009").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_descuentos.getCell("G10010").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_descuentos.getCell("G10011").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;

  hoja_descuentos.getCell("H10006").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_descuentos.getCell("H10007").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_descuentos.getCell("H10008").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_descuentos.getCell("H10009").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_descuentos.getCell("H10010").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_descuentos.getCell("H10011").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;

  hoja_descuentos.getCell("I10006").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_descuentos.getCell("I10007").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_descuentos.getCell("I10008").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_descuentos.getCell("I10009").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_descuentos.getCell("I10010").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_descuentos.getCell("I10011").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;

  return hoja_descuentos;
}

function construirHojaReembolsosOrdenPago(oficina_nombre, listaReembolsos, hoja_descuentos) {
  hoja_descuentos.getCell("A1").alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true
  };
  hoja_descuentos.getCell("A2").alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true
  };
  hoja_descuentos.getCell("A3").alignment = {
    horizontal: "center",
    wrapText: true
  };
  //COMBINAR CELDAS

  hoja_descuentos.mergeCells("A1", "M1");
  hoja_descuentos.getCell("A1").value = oficina_nombre;
  hoja_descuentos.getRow(1).height = 50;
  hoja_descuentos.getCell("A1").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF963030"
    }
  };
  hoja_descuentos.getCell("A1").font = {
    name: "Calibri",
    size: 18,
    bold: true,
    color: {
      argb: "FFFFFFFF"
    }
  };

  hoja_descuentos.mergeCells("A2", "M2");
  hoja_descuentos.getCell("A2").value = "Giros";
  hoja_descuentos.getRow(2).height = 30;
  hoja_descuentos.getCell("A2").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF963030"
    }
  };
  hoja_descuentos.getCell("A2").font = {
    name: "Calibri",
    size: 12,
    bold: true,
    color: {
      argb: "FFFFFFFF"
    }
  };

  hoja_descuentos.mergeCells("A3", "D3");
  hoja_descuentos.getCell("A3").value = "Sub Totales";
  hoja_descuentos.getRow(3).height = 30;

  //ENCABEZADOS

  hoja_descuentos.getRow(4).values = [
    "Nº Documento",
    "Nº Solicitud",
    "Origen",
    "Destino",
    "Fecha y hora de solicitud",
    "Fecha y hora de anulacion",
    "Beneficiario",
    "Solicitante",
    "Importe",    
    "Derecho de transferencia",
    "Bancos",
    "Estado",
    "Comision"
  ];

  ["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4", "J4", "K4", "L4", "M4"].map(key => {
    hoja_descuentos.getCell(key).alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true
    };
  });

  hoja_descuentos.getRow(4).height = 50;

  //IDENTIFICADORES COLUMNAS
  hoja_descuentos.columns = [
    {
      key: "St_documento_codigo",
      width: 11
    },
    {
      key: "nro_Solicitud",
      width: 8
    },
    {
      key: "oficinaorigen",
      width: 20
    },
    {
      key: "oficinadestino",
      width: 20
    },
    {
      key: "solicitud_fecha_hora",
      width: 20
    },
    {
      key: "anulacion_fecha_hora",
      width: 20
    },
    {
      key: "beneficiario_razon_social",
      width: 30
    },
    {
      key: "solicitante_razon_social",
      width: 30
    },
    {
      key: "importe",
      width: 14
    },
    {
      key: "comision_dt",
      width: 14
    },
    {
      key: "comision_banco",
      width: 14
    },
    {
      key: "st_estado",
      width: 12
    },
    {
      key: "comisiondestino",
      width: 14
    }
  ];

  hoja_descuentos.getCell("A3").font = {
    name: "Calibri",
    size: 12,
    bold: true,
    color: {
      argb: "FFFFFFFF"
    }
  };

  ["H3", "I3", "J3", "K3", "L3", "M3"].map(key => {
    hoja_descuentos.getCell(key).font = {
      name: "Calibri",
      size: 11,
      bold: false,
      color: {
        argb: "FFFFFFFF"
      }
    };
  });
  //ESTILOS FILAS 3 Y 4
  ["A3", "B3", "C3", "D3", "E3", "F3", "G3", "H3", "I3", "J3", "K3", "L3", "M3"].map(key => {
    hoja_descuentos.getCell(key).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FF963030"
      }
    };
  });

  ["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4", "J4", "K4", "L4", "M4"].map(key => {
    hoja_descuentos.getCell(key).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FFE69696"
      }
    };
  });

  ["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4", "J4", "K4", "L4", "M4"].map(key => {
    hoja_descuentos.getCell(key).font = {
      name: "Calibri",
      size: 11,
      bold: true,
      color: {
        argb: "FF000000"
      }
    };
  });
  ["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4", "J4", "K4", "L4", "M4"].map(key => {
    hoja_descuentos.getCell(key).border = {
      left: {
        style: "thin",
        color: {
          argb: "FF548235"
        }
      },
      right: {
        style: "thin",
        color: {
          argb: "FF548235"
        }
      }
    };
  });

  //FORMATO DE CELDAS
  hoja_descuentos.getColumn(5).numFmt = "dd/mm/yyyy h:mm";
  hoja_descuentos.getColumn(6).numFmt = "dd/mm/yyyy h:mm";
  hoja_descuentos.getColumn(9).numFmt = '_-"S/."* #,##0.00_-;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';
  hoja_descuentos.getColumn(10).numFmt = '_-"S/."* #,##0.00_-;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';
  hoja_descuentos.getColumn(11).numFmt = '_-"S/."* #,##0.00_-;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';
  hoja_descuentos.getColumn(13).numFmt = '_-"S/."* #,##0.00_-;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';

  //AGREGAR FILAS
  hoja_descuentos.addRows(listaReembolsos);
  //FORMULAS
  hoja_descuentos.getCell("I3").value = {
    formula: "SUM(I5:I10000)"
  };
  hoja_descuentos.getCell("J3").value = {
    formula: "SUM(J5:J10000)"
  };
  hoja_descuentos.getCell("K3").value = {
    formula: "SUM(L5:L10000)"
  };
  hoja_descuentos.getCell("M3").value = {
    formula: "SUM(M5:M10000)"
  };
  //FILTROS
  hoja_descuentos.autoFilter = {
    from: {
      row: 4,
      column: 1
    },
    to: {
      row: 10000,
      column: 11
    }
  };

  hoja_descuentos.getCell("D10005").value = "Tipo";
  hoja_descuentos.getCell("E10005").value = "Cantidad";
  hoja_descuentos.getCell("F10005").value = "Importe";
  hoja_descuentos.getCell("G10005").value = "DT";
  hoja_descuentos.getCell("H10005").value = "Bancos";
  hoja_descuentos.getCell("I10005").value = "Comision";

  hoja_descuentos.getCell("D10006").value = "ARREGLO";
  hoja_descuentos.getCell("D10007").value = "PENDIENTE";
  hoja_descuentos.getCell("D10008").value = "PAGADO";
  hoja_descuentos.getCell("D10009").value = "ANULADO";
  hoja_descuentos.getCell("D10010").value = "REEMBOLSADO";

  //FORMULAS FILA CANTIDAD
  hoja_descuentos.getCell("E10006").value = {
    formula: "COUNTIF(L5:L10000,D10006)"
  };
  hoja_descuentos.getCell("E10007").value = {
    formula: "COUNTIF(L5:L10000,D10007)"
  };
  hoja_descuentos.getCell("E10008").value = {
    formula: "COUNTIF(L5:L10000,D10008)"
  };
  hoja_descuentos.getCell("E10009").value = {
    formula: "COUNTIF(L5:L10000,D10009)"
  };
  hoja_descuentos.getCell("E10010").value = {
    formula: "COUNTIF(L5:L10000,D10010)"
  };

  //FORMULAS FILA IMPORTE
  hoja_descuentos.getCell("F10006").value = {
    formula: "SUMIF(L$5:L$10000,D10006,I$5:I$10000)"
  };
  hoja_descuentos.getCell("F10007").value = {
    formula: "SUMIF(L$5:L$10000,D10007,I$5:I$10000)"
  };
  hoja_descuentos.getCell("F10008").value = {
    formula: "SUMIF(L$5:L$10000,D10008,I$5:I$10000)"
  };
  hoja_descuentos.getCell("F10009").value = {
    formula: "SUMIF(L$5:L$10000,D10009,I$5:I$10000)"
  };
  hoja_descuentos.getCell("F10010").value = {
    formula: "SUMIF(L$5:L$10000,D10010,I$5:I$10000)"
  };

  //FORMULAS FILA DT
  hoja_descuentos.getCell("G10006").value = {
    formula: "SUMIF(L$5:L$10000,D10006,J$5:J$10000)"
  };
  hoja_descuentos.getCell("G10007").value = {
    formula: "SUMIF(L$5:L$10000,D10007,J$5:J$10000)"
  };
  hoja_descuentos.getCell("G10008").value = {
    formula: "SUMIF(L$5:L$10000,D10008,J$5:J$10000)"
  };
  hoja_descuentos.getCell("G10009").value = {
    formula: "SUMIF(L$5:L$10000,D10009,J$5:J$10000)"
  };
  hoja_descuentos.getCell("G10010").value = {
    formula: "SUMIF(L$5:L$10000,D10010,J$5:J$10000)"
  };

  //FORMULAS FILA BANCOS
  hoja_descuentos.getCell("H10006").value = {
    formula: "SUMIF(L$5:L$10000,D10006,K$5:K$10000)"
  };
  hoja_descuentos.getCell("H10007").value = {
    formula: "SUMIF(L$5:L$10000,D10007,K$5:K$10000)"
  };
  hoja_descuentos.getCell("H10008").value = {
    formula: "SUMIF(L$5:L$10000,D10008,K$5:K$10000)"
  };
  hoja_descuentos.getCell("H10009").value = {
    formula: "SUMIF(L$5:L$10000,D10009,K$5:K$10000)"
  };
  hoja_descuentos.getCell("H10010").value = {
    formula: "SUMIF(L$5:L$10000,D10010,K$5:K$10000)"
  };

  //FORMULAS FILA COMISION
  hoja_descuentos.getCell("I10006").value = {
    formula: "SUMIF(L$5:L$10000,D10006,M$5:M$10000)"
  };
  hoja_descuentos.getCell("I10007").value = {
    formula: "SUMIF(L$5:L$10000,D10007,M$5:M$10000)"
  };
  hoja_descuentos.getCell("I10008").value = {
    formula: "SUMIF(L$5:L$10000,D10008,M$5:M$10000)"
  };
  hoja_descuentos.getCell("I10009").value = {
    formula: "SUMIF(L$5:L$10000,D10009,M$5:M$10000)"
  };
  hoja_descuentos.getCell("I10010").value = {
    formula: "SUMIF(L$5:L$10000,D10010,M$5:M$10000)"
  };

  //FORMULAS DE SUMAS
  hoja_descuentos.getCell("E10011").value = {
    formula: "SUM(E10006:E10010)"
  };
  hoja_descuentos.getCell("F10011").value = {
    formula: "SUM(F10006:F10010)"
  };
  hoja_descuentos.getCell("G10011").value = {
    formula: "SUM(G10006:G10010)"
  };
  hoja_descuentos.getCell("H10011").value = {
    formula: "SUM(H10006:H10010)"
  };
  hoja_descuentos.getCell("I10011").value = {
    formula: "SUM(I10006:I10010)"
  };

  //FORMATO DE CELDAS
  hoja_descuentos.getCell("E10006").numFmt = "0";
  hoja_descuentos.getCell("E10007").numFmt = "0";
  hoja_descuentos.getCell("E10008").numFmt = "0";
  hoja_descuentos.getCell("E10009").numFmt = "0";
  hoja_descuentos.getCell("E10010").numFmt = "0";
  hoja_descuentos.getCell("E10011").numFmt = "0";

  hoja_descuentos.getCell("F10006").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_descuentos.getCell("F10007").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_descuentos.getCell("F10008").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_descuentos.getCell("F10009").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_descuentos.getCell("F10010").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_descuentos.getCell("F10011").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;

  hoja_descuentos.getCell("G10006").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_descuentos.getCell("G10007").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_descuentos.getCell("G10008").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_descuentos.getCell("G10009").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_descuentos.getCell("G10010").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_descuentos.getCell("G10011").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;

  hoja_descuentos.getCell("H10006").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_descuentos.getCell("H10007").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_descuentos.getCell("H10008").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_descuentos.getCell("H10009").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_descuentos.getCell("H10010").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_descuentos.getCell("H10011").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;

  hoja_descuentos.getCell("I10006").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_descuentos.getCell("I10007").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_descuentos.getCell("I10008").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_descuentos.getCell("I10009").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_descuentos.getCell("I10010").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;
  hoja_descuentos.getCell("I10011").numFmt = `_-[$S/.-es-PE]* #,##0.00_-;-[$S/.-es-PE]* #,##0.00_-;_-[$S/.-es-PE]* "-"??_-;_-@_-`;

  return hoja_descuentos;
}
