const Excel = require("exceljs");
const Sequelize = require("sequelize");
const models = require("../models");
const moment = require("moment");
const utils = require("../services/utils")
const Op = Sequelize.Op;
var filename = module.filename.split("/").slice(-1);

exports.excel = async (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];

  const id_cliente = req.params.id_cliente;
  const fechai = req.params.fechai;
  const fechaf = req.params.fechaf;
  let nombre = "TODAS";
  let cliente_nombre = "TODAS";
  if (id_cliente != "*") {
    const cliente = await models.cliente_proveedor.findOne({
      where: {
        id_cliente: id_cliente
      }
    });
    nombre = cliente.razon_social;
    cliente_nombre = cliente.nombres.replace(/ /g, "_");
  }

  models.sequelize
    .query(`SELECT * FROM resumen_cc_clientes('${id_cliente}', '${fechai}' ,'${fechaf}')`, {
      type: models.sequelize.QueryTypes.SELECT
    })
    .then(lista => {
      let listaresumen = [];
      lista.forEach(fila => {
        listaresumen.push({
          ...fila,
          fecha_hora_operacion: moment(fila.fecha_hora_operacion)
            .locale("es")
            .format("DD/MM/Y HH:mm:ss"),
          importe_ingreso: parseFloat(fila.importe_ingreso),
          importe_egreso: parseFloat(fila.importe_egreso),
          comision: parseFloat(fila.comision)
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
      let hoja_resumen = workbook.addWorksheet(cliente_nombre);
        construirHojaResumen(nombre, listaresumen, hoja_resumen, id_cliente);
      //CONSTRUIR EXCEL
      res.status(200);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
      res.setHeader("Content-Disposition", `attachment; filename=CC_${cliente_nombre}.xlsx`);
      workbook.xlsx.write(res).then(function() {
        res.end();
      });
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: err.message });
      res.status(409).send("Error al generar");
      console.log(err);
    });
};

function construirHojaResumen(cliente_nombre, listaresumen, hoja_resumen, id_cliente) {
  hoja_resumen.getCell("A1").alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true
  };
  hoja_resumen.getCell("A2").alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true
  };
  hoja_resumen.getCell("B2").alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true
  };
  hoja_resumen.getCell("E2").alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true
  };
  hoja_resumen.getCell("F2").alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true
  };
  hoja_resumen.getCell("A3").alignment = {
    horizontal: "center",
    wrapText: true
  };
  //COMBINAR CELDAS

  hoja_resumen.mergeCells("A1", "F1");
  hoja_resumen.getCell("A1").value = "Cuenta Corriente";
  hoja_resumen.getRow(1).height = 30;
  hoja_resumen.getCell("A1").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF202355"
    }
  };
  hoja_resumen.getCell("A1").font = {
    name: "Calibri",
    size: 18,
    bold: true,
    color: {
      argb: "FFFFFFFF"
    }
  };

  //hoja_recibidos.mergeCells("A2", "F2");
  hoja_resumen.getCell("A2").value = "Nombre:";
  hoja_resumen.getRow(2).height = 30;
  hoja_resumen.getCell("A2").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF202355"
    }
  };
  hoja_resumen.getCell("A2").font = {
    name: "Calibri",
    size: 12,
    bold: true,
    color: {
      argb: "FFFFFFFF"
    }
  };

  hoja_resumen.mergeCells("B2", "D2");
  hoja_resumen.getCell("B2").value = cliente_nombre;
  hoja_resumen.getRow(2).height = 30;
  hoja_resumen.getCell("B2").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF202355"
    }
  };
  hoja_resumen.getCell("B2").font = {
    name: "Calibri",
    size: 12,
    bold: true,
    color: {
      argb: "FFFFFFFF"
    }
  };

  hoja_resumen.getCell("E2").value = "DNI: ";
  hoja_resumen.getRow(2).height = 30;
  hoja_resumen.getCell("E2").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF202355"
    }
  };
  hoja_resumen.getCell("E2").font = {
    name: "Calibri",
    size: 12,
    bold: true,
    color: {
      argb: "FFFFFFFF"
    }
  };

  hoja_resumen.getCell("F2").value = id_cliente;
  hoja_resumen.getRow(2).height = 30;
  hoja_resumen.getCell("F2").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF202355"
    }
  };
  hoja_resumen.getCell("F2").font = {
    name: "Calibri",
    size: 12,
    bold: true,
    color: {
      argb: "FFFFFFFF"
    }
  };
  //hoja_resumen.mergeCells("A3", "D3");
  //hoja_resumen.getCell("A3").value = "Sub Totales";
  hoja_resumen.getRow(3).height = 30;

  //ENCABEZADOS
  hoja_resumen.getRow(4).values = [
    "Fecha",
    "Código",
    "Cuenta",
    "Concepto",
    "Ingreso",
    "Egreso"
  ];

  ["A4", "B4", "C4", "D4", "E4", "F4"].map(key => {
    hoja_resumen.getCell(key).alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true
    };
  });
  hoja_resumen.getRow(4).height = 50;

  //IDENTIFICADORES COLUMNAS
  hoja_resumen.columns = [
    {
      key: "fecha_hora_operacion",
      width: 22
    },
    {
      key: "nro_operacion",
      width: 17
    },
    {
      key: "id_cuenta_tercera",
      width: 17
    },
    {
      key: "concepto",
      width: 67
    },
    {
      key: "importe_ingreso",
      width: 17
    },
    {
      key: "importe_egreso",
      width: 17
    }
  ];

  //ESTILOS FILAS 3 Y 4
  ["A3", "B3", "C3", "D3", "E3", "F3"].map(key => {
    hoja_resumen.getCell(key).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FF202355"
      }
    };
  });

  hoja_resumen.getCell("A3").font = {
    name: "Calibri",
    size: 12,
    bold: true,
    color: {
      argb: "FFFFFFFF"
    }
  };

  ["A3", "B3", "C3", "D3", "E3","F3"].map(key => {
    hoja_resumen.getCell(key).font = {
      name: "Calibri",
      size: 11,
      bold: false,
      color: {
        argb: "FFFFFFFF"
      }
    };
  });

  ["A4", "B4", "C4", "D4", "E4", "F4"].map(key => {
    hoja_resumen.getCell(key).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FF7D7F7D"
      }
    };
  });
  ["A4", "B4", "C4", "D4", "E4", "F4"].map(key => {
    hoja_resumen.getCell(key).font = {
      name: "Calibri",
      size: 11,
      bold: true,
      color: {
        argb: "FF000000"
      }
    };
  });
  ["A4", "B4", "C4", "D4", "E4", "F4"].map(key => {
    hoja_resumen.getCell(key).border = {
      left: {
        style: "thin",
        color: {
          argb: "FF202355"
        }
      },
      right: {
        style: "thin",
        color: {
          argb: "FF202355"
        }
      }
    };
  });

  //FORMATO DE CELDAS
  hoja_resumen.getColumn(1).numFmt = "dd/mm/yyyy h:mm:ss";
  hoja_resumen.getCell("E3").numFmt = '_-"S/."* #,##0.00;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';
  hoja_resumen.getCell("F3").numFmt = '_-"S/."* #,##0.00;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';
  hoja_resumen.getColumn(5).numFmt = '_-"S/."* #,##0.00;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';
  hoja_resumen.getColumn(6).numFmt = '_-"S/."* #,##0.00;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';

  //AGREGAR FILAS
  hoja_resumen.addRows(listaresumen);
  //FORMULAS
  hoja_resumen.getCell("E3").value = {
    formula: "SUM(E5:E10000)"
  };

  hoja_resumen.getCell("F3").value = {
    formula: "SUM(F5:F10000)"
  };
  //FILTROS
  hoja_resumen.autoFilter = {
    from: {
      row: 4,
      column: 1
    },
    to: {
      row: 10000,
      column: 6
    }
  };

  return hoja_resumen;
}
