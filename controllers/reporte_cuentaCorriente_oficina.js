const Sequelize = require("sequelize");
var PdfPrinter = require("pdfmake");
const Excel = require("exceljs");
const models = require("../models");
const moment = require("moment");
const utils = require("../services/utils")
const Op = Sequelize.Op;
var filename = module.filename.split("/").slice(-1);

exports.operaciones_oficina = (req, res) => {
  var logger = req.app.get("winston");
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, async (err, usuario) => {
      usuario = JSON.parse(usuario);
      const id_oficina = req.params.id_oficina;

      models.sequelize
      .query(`select * from saldos_cuenta_oficinas('${id_oficina}');`, {
        type: models.sequelize.QueryTypes.SELECT,
        nest: true
      })
      .then(saldos => {
        res.json(saldos);
      })
      .catch(err => {
        logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
        res.status(409).send(err.message);
        console.log(err);
      });
    })      
  });
};

exports.listar_oficinas = (req, res) => {
  var logger = req.app.get("winston");
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, async (err, usuario) => {
      usuario = JSON.parse(usuario);

      models.sequelize.query(
        `select oficina_codigo_src,oficina.oficina_nombre from cuenta_corriente `+
        `inner join oficina on cuenta_corriente.oficina_codigo_src = oficina.oficina_codigo `+
        `where es_servicio = false group by oficina_codigo_src,oficina.oficina_nombre`,
        {
          type: models.sequelize.QueryTypes.SELECT
        }
      )
      .then(resp => {
        res.json(resp);
      })
      .catch(err => {
        logger.log("error", { ubicacion: filename, token: token, message: {mensaje: err.message, tracestack: err.stack }});
        res.status(409).send(err.message);
        console.log(err);
      })
    })
  });
};

exports.excel_cc_of = async (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];

  const id_oficina = req.params.id_oficina;

  models.sequelize
    .query(
      `select * from saldos_cuenta_oficinas('${id_oficina}');`,
      {
        type: models.sequelize.QueryTypes.SELECT
      }
    )
    .then(lista => {
      let listaCC = [];
      lista.forEach(fila => {
        listaCC.push({
          ...fila,
          retirosoles: parseFloat(fila.retirosoles),
          retirodolares: parseFloat(fila.retirodolares),
          depositosoles: parseFloat(fila.depositosoles),
          depositodolares: parseFloat(fila.depositodolares),
          totalsoles: parseFloat(fila.depositosoles) - parseFloat(fila.retirosoles),
          totaldolar: parseFloat(fila.depositodolares) - parseFloat(fila.retirodolares)
        });
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
      let hoja_cc = workbook.addWorksheet("Saldos Cuentas Corrientes");
      construirHojaCC(listaCC, hoja_cc);
      //CONSTRUIR EXCEL
      res.status(200);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
      res.setHeader("Content-Disposition", `attachment; filename=Saldos_CC_${moment()
        .locale("es")
        .format("DD-MM-YYYY_HH'mm")}.xlsx`);
      workbook.xlsx.write(res).then(function() {
        res.end();
      });
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: err.message });
      res.status(409).send("Error al generar");
      console.log(err)
    });
};

function construirHojaCC(listaCC, hoja_cc) {
  hoja_cc.getCell("A1").alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true
  };
  hoja_cc.getCell("A2").alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true
  };
  hoja_cc.getCell("A3").alignment = {
    horizontal: "center",
    wrapText: true
  };
  //COMBINAR CELDAS

  hoja_cc.mergeCells("A2", "I2");
  hoja_cc.getCell("A2").value = "SALDOS CUENTAS CORRIENTES";
  hoja_cc.getRow(2).height = 30;
  hoja_cc.getCell("A2").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF776E49"
    }
  };
  hoja_cc.getCell("A2").font = {
    name: "Calibri",
    size: 12,
    bold: true,
    color: {
      argb: "FFFFFFFF"
    }
  };

  hoja_cc.mergeCells("A3", "C3");
  hoja_cc.getCell("A3").value = "Sub Totales";
  hoja_cc.getRow(3).height = 30;

  //ENCABEZADOS

  hoja_cc.getRow(4).values = [
    "Código",
    "Oficina",
    "Cliente",
    "Depósito S/.",
    "Retiro S/.",
    "Depósito $.",
    "Retiro $.",
    "Total S/.",
    "Total $."
  ];

  ["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4"].map(key => {
    hoja_cc.getCell(key).alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true
    };
  });
  hoja_cc.getRow(4).height = 50;

  //IDENTIFICADORES COLUMNAS
  hoja_cc.columns = [
    {
      key: "oficina_codigo_src",
      width: 10
    },
    {
      key: "oficina_nombre",
      width: 30
    },
    {
      key: "razon_social",
      width: 45
    },   
    {
      key: "depositosoles",
      width: 20
    },
    {
      key: "retirosoles",
      width: 20
    },
    {
      key: "depositodolares",
      width: 15
    },
    {
      key: "retirodolares",
      width: 15
    },
    {
      key: "totalsoles",
      width: 20
    },
    {
      key: "totaldolar",
      width: 15
    }
  ];

  //ESTILOS FILAS 3 Y 4
  ["A3", "B3", "C3", "D3", "E3", "F3", "G3", "H3", "I3"].map(key => {
    hoja_cc.getCell(key).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FF776E49"
      }
    };
  });

  hoja_cc.getCell("A3").font = {
    name: "Calibri",
    size: 12,
    bold: true,
    color: {
      argb: "FFFFFFFF"
    }
  };

  ["D3","E3","F3","G3", "H3", "I3"].map(key => {
    hoja_cc.getCell(key).font = {
      name: "Calibri",
      size: 11,
      bold: false,
      color: {
        argb: "FFFFFFFF"
      }
    };
  });

  ["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4"].map(key => {
    hoja_cc.getCell(key).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FFD0C07A"
      }
    };
  });
  ["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4"].map(key => {
    hoja_cc.getCell(key).font = {
      name: "Calibri",
      size: 11,
      bold: true,
      color: {
        argb: "FF000000"
      }
    };
  });
  ["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4"].map(key => {
    hoja_cc.getCell(key).border = {
      left: {
        style: "thin",
        color: {
          argb: "FF776E49"
        }
      },
      right: {
        style: "thin",
        color: {
          argb: "FF776E49"
        }
      }
    };
  });

  //FORMATO DE CELDAS
  hoja_cc.getColumn(4).numFmt = '_-"S/."* #,##0.00;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';
  hoja_cc.getColumn(5).numFmt = '_-"S/."* #,##0.00;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';
  hoja_cc.getColumn(6).numFmt = '_-"S/."* #,##0.00;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';
  hoja_cc.getColumn(7).numFmt = '_-"S/."* #,##0.00;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';
  hoja_cc.getColumn(8).numFmt = '_-"S/."* #,##0.00;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';
  hoja_cc.getColumn(9).numFmt = '_-"S/."* #,##0.00;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';

  //AGREGAR FILAS
  hoja_cc.addRows(listaCC);
  //FORMULAS
  hoja_cc.getCell("D3").value = {
    formula: "SUM(D5:D10000)"
  };
  hoja_cc.getCell("E3").value = {
    formula: "SUM(E5:E10000)"
  };
  hoja_cc.getCell("F3").value = {
    formula: "SUM(F5:F10000)"
  };
  hoja_cc.getCell("G3").value = {
    formula: "SUM(G5:G10000)"
  };
  hoja_cc.getCell("H3").value = {
    formula: "SUM(H5:H10000)"
  };
  hoja_cc.getCell("I3").value = {
    formula: "SUM(I5:I10000)"
  };
  //FILTROS
  hoja_cc.autoFilter = {
    from: {
      row: 4,
      column: 1
    },
    to: {
      row: 10000,
      column: 9
    }
  };

  return hoja_cc;
}