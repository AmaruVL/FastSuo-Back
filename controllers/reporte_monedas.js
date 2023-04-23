const Excel = require("exceljs");
const models = require("../models");
const utils = require("../services/utils")
var filename = module.filename.split("/").slice(-1);

exports.excel = (req, res) => {
  var logger = req.app.get("winston");
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado => {
    redis.get(tokenDecodificado.id, async (err, usuario) => {
      usuario = JSON.parse(usuario);

      const oficina = req.body.oficina ? req.body.oficina : usuario.oficina_codigo;
      const caja_codigo = req.body.caja_codigo ? req.body.caja_codigo : usuario.caja_codigo;
      const fecha = req.body.fecha;

      //LISTAR GIROS DESDE OFICINA XXXXXXX
      models.sequelize
        .query(
          `SELECT "moneda_denominacion"."valor","moneda_cierre"."cantidad","moneda_denominacion"."nombre",` +
            `"moneda_cierre"."id","caja"."oficina_codigo","caja"."caja_nombre","moneda_cierre"."caja_codigo",` +
            `"moneda_denominacion"."tipo_moneda" FROM moneda_cierre ` +
            `LEFT OUTER JOIN moneda_denominacion ON "moneda_cierre"."id"="moneda_denominacion"."id" ` +
            `LEFT OUTER JOIN caja ON "moneda_cierre"."caja_codigo"="caja"."caja_codigo"` +
            `WHERE (CASE WHEN :caja_codigo != '*' THEN "moneda_cierre"."caja_codigo"=:caja_codigo ` +
            `ELSE true END) AND "moneda_denominacion"."tipo_moneda"='SOL'` +
            `AND DATE("moneda_cierre"."fecha_trabajo")=:fecha ORDER BY caja_codigo,id`,
          {
            replacements: {
              //oficina: oficina,
              caja_codigo: caja_codigo,
              fecha: fecha
            },
            type: models.sequelize.QueryTypes.SELECT
          }
        )
        .then(lista => {
          let listaMonedasSoles = [];
          lista.forEach(fila => {
            listaMonedasSoles.push([parseFloat(fila.valor), parseFloat(fila.cantidad)]);
          });
          const caja_nombre = caja_codigo != "*" ? lista[0].caja_nombre : "TODAS";

          models.sequelize
            .query(
              `SELECT "moneda_denominacion"."valor","moneda_cierre"."cantidad","moneda_denominacion"."nombre",` +
                `"moneda_cierre"."id","caja"."oficina_codigo","caja"."caja_nombre","moneda_cierre"."caja_codigo",` +
                `"moneda_denominacion"."tipo_moneda" FROM moneda_cierre ` +
                `LEFT OUTER JOIN moneda_denominacion ON "moneda_cierre"."id"="moneda_denominacion"."id" ` +
                `LEFT OUTER JOIN caja ON "moneda_cierre"."caja_codigo"="caja"."caja_codigo"` +
                `WHERE (CASE WHEN :caja_codigo != '*' THEN "moneda_cierre"."caja_codigo"=:caja_codigo ` +
                `ELSE true END) AND "moneda_denominacion"."tipo_moneda"='DOLAR'` +
                `AND DATE("moneda_cierre"."fecha_trabajo")=:fecha ORDER BY caja_codigo,id`,
              {
                replacements: {
                  //oficina: oficina,
                  caja_codigo: caja_codigo,
                  fecha: fecha
                },
                type: models.sequelize.QueryTypes.SELECT
              }
            )
            .then(lista => {
              let listaMonedasDolares = [];
              lista.forEach(fila => {
                listaMonedasDolares.push([parseFloat(fila.valor), parseFloat(fila.cantidad)]);
              });

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
              let hoja_monedas = workbook.addWorksheet("Monedas");
              construirHojaMonedas(caja_nombre, listaMonedasSoles, listaMonedasDolares, hoja_monedas);
              //construirHojaOrdenpago(oficina_nombre, listaOrdenesPago, hoja_orden_pago);

              //CONSTRUIR EXCEL
              res.status(200);
              res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
              res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
              res.setHeader("Content-Disposition", `attachment; filename=${caja_nombre + fecha}.xlsx`);
              workbook.xlsx.write(res).then(function() {
                res.end();
              });
            })
            .catch(err => {
              logger.log("error", { ubicacion: filename, token: token, err });
              res.status(409).send("Error al generar");
            });
        });
    });
  });
};

function construirHojaMonedas(caja_nombre, listaMonedasSoles, listaMonedasDolares, hoja_monedas) {
  hoja_monedas.getCell("C3").alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true
  };
  hoja_monedas.getCell("C3").value = "CAJA: ";
  hoja_monedas.getCell("C3").font = {
    name: "Calibri",
    size: 16,
    bold: true,
    color: {
      argb: "00000000"
    }
  };
  hoja_monedas.getCell("C5").value = "SOLES";
  hoja_monedas.getCell("C5").font = {
    name: "Calibri",
    size: 14,
    bold: true,
    color: {
      argb: "00000000"
    }
  };
  hoja_monedas.getCell("C21").value = "DOLARES";
  hoja_monedas.getCell("C21").font = {
    name: "Calibri",
    size: 14,
    bold: true,
    color: {
      argb: "00000000"
    }
  };
  hoja_monedas.getColumn(3).width = 17;
  hoja_monedas.getColumn(3).font = {
    name: "Calibri",
    size: 14,
    bold: false,
    color: {
      argb: "00000000"
    }
  };
  hoja_monedas.getColumn(4).width = 10;
  hoja_monedas.getColumn(5).width = 20;

  //COMBINAR CELDAS

  hoja_monedas.mergeCells("D3", "E3");
  hoja_monedas.getCell("D3").value = caja_nombre;
  hoja_monedas.getRow(3).height = 18.75;
  hoja_monedas.getCell("D3").font = {
    name: "Calibri",
    size: 16,
    bold: true,
    color: {
      argb: "00000000"
    }
  };

  [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 22, 23, 24, 25, 26, 27, 28].map(x => {
    (hoja_monedas.getCell(x, 4).fill = { type: "pattern", pattern: "darkVertical", fgColor: { argb: "FFFFFF00" } }),
      (hoja_monedas.getCell(x, 4).font = { name: "Calibri", size: 14, bold: false, color: { argb: "00000000" } });
  });
  [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 22, 23, 24, 25, 26, 27, 28].map(y => {
    (hoja_monedas.getCell(y, 5).value = { formula: "C" + y + "*D" + y }),
      (hoja_monedas.getCell(y, 5).border = {
        top: { style: "thin", color: { argb: "00000000" } },
        left: { style: "thin", color: { argb: "00000000" } },
        bottom: { style: "thin", color: { argb: "00000000" } },
        right: { style: "thin", color: { argb: "00000000" } }
      }),
      (hoja_monedas.getCell(y, 5).font = { name: "Calibri", size: 14, bold: false, color: { argb: "00000000" } });
  });

  //FORMATO DE CELDAS
  hoja_monedas.getColumn(3).numFmt = '_-"S/."* #,##0.00;-"S/."* #,##0.00;_-"S/."* "-"??_-;_-@_-';
  hoja_monedas.getColumn(5).numFmt = '_-"S/."* #,##0.00;-"S/."* #,##0.00;_-"S/."* "-"??_-;_-@_-';

  //_------------

  hoja_monedas.mergeCells("C17", "D17");
  hoja_monedas.getCell("C17").value = "TOTAL";
  hoja_monedas.getRow(17).height = 18.75;
  hoja_monedas.getCell("C17").font = {
    name: "Calibri",
    size: 14,
    bold: true,
    color: {
      argb: "00000000"
    }
  };

  hoja_monedas.mergeCells("C29", "D29");
  hoja_monedas.getCell("C29").value = "TOTAL";
  hoja_monedas.getRow(29).height = 18.75;
  hoja_monedas.getCell("C29").font = {
    name: "Calibri",
    size: 14,
    bold: true,
    color: {
      argb: "00000000"
    }
  };

  hoja_monedas.getCell("E17").value = { formula: "SUM(E6:E16)" };
  hoja_monedas.getCell("E17").border = {
    top: { style: "thin", color: { argb: "00000000" } },
    left: { style: "thin", color: { argb: "00000000" } },
    bottom: { style: "thin", color: { argb: "00000000" } },
    right: { style: "thin", color: { argb: "00000000" } }
  };
  hoja_monedas.getCell("E17").font = { name: "Calibri", size: 14, bold: true, color: { argb: "00000000" } };
  hoja_monedas.getCell("E29").value = { formula: "SUM(E22:E28)" };
  hoja_monedas.getCell("E29").border = {
    top: { style: "thin", color: { argb: "00000000" } },
    left: { style: "thin", color: { argb: "00000000" } },
    bottom: { style: "thin", color: { argb: "00000000" } },
    right: { style: "thin", color: { argb: "00000000" } }
  };
  hoja_monedas.getCell("E29").font = { name: "Calibri", size: 14, bold: true, color: { argb: "00000000" } };

  //TABLAS

  hoja_monedas.addTable({
    name: "TablaSoles",
    ref: "C6",
    headerRow: false,
    totalsRow: false,
    style: {
      theme: "TableStyleLight15"
    },
    columns: [{ name: "Moneda" }, { name: "Cantidad" }],
    rows: listaMonedasSoles
  });

  hoja_monedas.addTable({
    name: "TablaDolares",
    ref: "C22",
    headerRow: false,
    totalsRow: false,
    style: {
      theme: "TableStyleLight15",
      showRowStripes: true
    },
    columns: [{ name: "Moneda" }, { name: "Cantidad" }],
    rows: listaMonedasDolares
  });

  return hoja_monedas;
}
