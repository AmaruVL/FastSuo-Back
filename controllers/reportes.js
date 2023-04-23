const Sequelize = require("sequelize");
const Excel = require("exceljs");
var PdfPrinter = require("pdfmake");
const models = require("../models");
const moment = require("moment");
const utils = require("../services/utils")
const Op = Sequelize.Op;
var filename = module.filename.split("/").slice(-1);

exports.obtenerDatos = (req, res) => {
	var logger = req.app.get("winston");
	console.log("-------------------------------------------------------------------------")
	console.log(req.body.caja_codigo);
	console.log(req.body.modulo);
	console.log(req.body.fecha_inicio);
	console.log(req.body.fecha_final);
	/*var Modulos= req.body.modulo[1];
	console.log(Modulos);*/
	models.operacion_caja
		.findAll({
			where: {
				caja_codigo: req.body.caja_codigo,
				modulo: req.body.modulo,
				fecha_trabajo: {
					[Op.gte]: req.body.fecha_inicio,
					[Op.lte]: req.body.fecha_final,
				}
			}
		})
		.then(lista => {
			res.json(lista);
		})
		.catch(err => {
			logger.log("error", { ubicacion: filename, token: token, message : err.message });
			res.json({
				error: err.errors
			});
		});
};

exports.saldos_caja = (req,res) =>{
	var logger = req.app.get("winston");
	var redis = req.app.get("redis");	
	const token = req.header("Authorization").split(" ")[1];
	utils.decodeToken(token, tokenDecodificado => {
		//OBTENER DATOS DEL USUARIO DESDE REDIS
		redis.get(tokenDecodificado.id, async(err, usuario) => {
			usuario = JSON.parse(usuario);
			var caja_cod = req.body.caja_cod ? req.body.caja_cod : usuario.caja_codigo;
			var fecha_inicio = req.body.fecha_inicio;
			var fecha_fin = req.body.fecha_fin;
			models.sequelize
			.query(
				`SELECT * FROM saldos_caja2(:fecha_inicio,:fecha_fin,:caja_cod)`,
			  {	
				replacements: {
				  fecha_inicio: fecha_inicio,
				  fecha_fin: fecha_fin,
				  caja_cod: caja_cod
				},
				type: models.sequelize.QueryTypes.SELECT
			  }
			)
			.then(resp => {
			  res.json(resp);
			})
			.catch(err => {
			  logger.log("error", { ubicacion: filename, token: token, message : err.message });
			  res.status(409).send(err);
			});
		})
	})  	
}

exports.saldos_oficina = (req,res) =>{
	var logger = req.app.get("winston");
	var redis = req.app.get("redis");	
	const token = req.header("Authorization").split(" ")[1];
	utils.decodeToken(token, tokenDecodificado => {
		//OBTENER DATOS DEL USUARIO DESDE REDIS
		redis.get(tokenDecodificado.id, async(err, usuario) => {
			usuario = JSON.parse(usuario);
			var oficina_cod = req.body.oficina_cod;
			var fecha_inicio = req.body.fecha_inicio;
			var fecha_fin = req.body.fecha_fin;		
			models.sequelize
			.query(
				`SELECT * FROM saldos_oficina2(:fecha_inicio,:fecha_fin,:oficina_cod)`,
			  {	
				replacements: {
					fecha_inicio: fecha_inicio,
					fecha_fin: fecha_fin,
				  	oficina_cod: oficina_cod
				},
				type: models.sequelize.QueryTypes.SELECT
			  }
			)
			.then(resp => {
			  res.json(resp);
			})
			.catch(err => {
			  logger.log("error", { ubicacion: filename, token: token, message : err.message });
			  res.status(409).send(err);
			});
		})
	})  	
}

exports.saldos_empresa = (req,res) =>{
	var logger = req.app.get("winston");
	var redis = req.app.get("redis");	
	const token = req.header("Authorization").split(" ")[1];
	utils.decodeToken(token, tokenDecodificado => {
		//OBTENER DATOS DEL USUARIO DESDE REDIS
		redis.get(tokenDecodificado.id, async(err, usuario) => {
			usuario = JSON.parse(usuario);
			var empresa_cod = req.body.empresa_cod;
			var fecha_inicio = req.body.fecha_inicio;
			var fecha_fin = req.body.fecha_fin;			
			models.sequelize
			.query(
				`SELECT * FROM saldos_empresa2(:fecha_inicio,:fecha_fin,:empresa_cod)`,
			  {	
				replacements: {
					fecha_inicio: fecha_inicio,
					fecha_fin: fecha_fin,
				  empresa_cod: empresa_cod
				},
				type: models.sequelize.QueryTypes.SELECT
			  }
			)
			.then(resp => {
			  res.json(resp);
			})
			.catch(err => {
			  logger.log("error", { ubicacion: filename, token: token, message : err.message });
			  res.status(409).send(err);
			});
		})
	})  	
}

exports.detalle_caja = (req, res) => {
	var logger = req.app.get("winston");
	var redis = req.app.get("redis");
	const token = req.header("Authorization").split(" ")[1];

	utils.decodeToken(token, tokenDecodificado => {
		//OBTENER DATOS DEL USUARIO DESDE REDIS
		redis.get(tokenDecodificado.id, (err, usuario) => {
			usuario = JSON.parse(usuario);
			var caja_codigo = req.body.caja_codigo ? req.body.caja_codigo : usuario.caja_codigo;
			var fecha_inicio = req.body.fecha_inicio;
			var fecha_final = req.body.fecha_final;
			
			models.sequelize
				.query(
					`select * from giros('` + caja_codigo + `','','` + fecha_inicio + ' 00:00:00.000+00'+ `','` + fecha_final + ' 23:59:59.000+00' + `');`, {
						type: models.sequelize.QueryTypes.SELECT
					}
				)
				.then(lista1 => {
					models.sequelize
						.query(
							`select * from orden_pago('` + caja_codigo + `','','` + fecha_inicio + `','` + fecha_final + `');`, {
								type: models.sequelize.QueryTypes.SELECT
							}
						)
							.then(lista2 => {
								models.sequelize
									.query(
										`select * from recibos2('` + caja_codigo + `','','` + fecha_inicio + `','` + fecha_final + `');`, {
											type: models.sequelize.QueryTypes.SELECT
										}
									)
									.then(lista3 => {
										models.sequelize
										.query(
											`select * from servicios_caja('` + caja_codigo + `','` + fecha_inicio + `','` + fecha_final + `');`, {
											type: models.sequelize.QueryTypes.SELECT
										})
										.then(lista4 => {
											var lista = {
												transferencias: lista1,
												ordenesPago: lista2,
												recibos: lista3,
												servicios: lista4
											};
											res.json(lista);
										})
										.catch(err => {
											logger.log("error", { ubicacion: filename, token: token, err });
											res.json({
												error: err.errors
											});
										})
									})
									.catch(err => {
										logger.log("error", { ubicacion: filename, token: token, err });
										res.json({
											error: err.errors
										});
									})
							})
							.catch(err => {
								logger.log("error", { ubicacion: filename, token: token, err });
								res.json({
									error: err.errors
								});
							})
							.catch(err => {
								logger.log("error", { ubicacion: filename, token: token, err });
								res.json({
									error: err.errors
								});
							});
						})
						.catch(err => {
							logger.log("error", { ubicacion: filename, token: token, err });
							res.json({
								error: err.errors
							});
						});
				})
		})
};

exports.detalle_oficina = (req, res) => {
	var logger = req.app.get("winston");
	var redis = req.app.get("redis");
	const token = req.header("Authorization").split(" ")[1];

	utils.decodeToken(token, tokenDecodificado => {
		//OBTENER DATOS DEL USUARIO DESDE REDIS
		redis.get(tokenDecodificado.id, (err, usuario) => {
			usuario = JSON.parse(usuario);
			var oficina_codigo = req.body.oficina_codigo ? req.body.oficina_codigo : usuario.oficina_codigo;
			var fecha_inicio = req.body.fecha_inicio;
			var fecha_final = req.body.fecha_final;
			models.sequelize
				.query(
					`select * from giros_oficina('` + oficina_codigo + `','','` + fecha_inicio + ' 00:00:00.000+00'+ `','` + fecha_final + ' 23:59:59.000+00' + `');`, {
						type: models.sequelize.QueryTypes.SELECT
					}
				)
				.then(lista1 => {
					models.sequelize
						.query(
							`select * from orden_pago_oficina('` + oficina_codigo + `','','` + fecha_inicio + `','` + fecha_final + `');`, {
								type: models.sequelize.QueryTypes.SELECT
							}
						)
							.then(lista2 => {
								models.sequelize
									.query(
										`select * from recibos_oficina2('` + oficina_codigo + `','','` + fecha_inicio + `','` + fecha_final + `');`, {
											type: models.sequelize.QueryTypes.SELECT
										}
									)
									.then(lista3 => {
										models.sequelize
										.query(
											`select * from servicios_oficina('` + oficina_codigo + `','` + fecha_inicio + `','` + fecha_final + `');`, {
											type: models.sequelize.QueryTypes.SELECT
										})
										.then(lista4 => {
											var lista = {
												transferencias: lista1,
												ordenesPago: lista2,
												recibos: lista3,
												servicios: lista4
											};
										
											res.json(lista);
										})
										.catch(err => {
											logger.log("error", { ubicacion: filename, token: token, err });
											res.json({
												error: err.errors
											});
										})
									})
									.catch(err => {
										logger.log("error", { ubicacion: filename, token: token, err });
										res.json({
											error: err.errors
										});
									})
							})
							.catch(err => {
								logger.log("error", { ubicacion: filename, token: token, err });
								res.json({
									error: err.errors
								});
							})
							.catch(err => {
								logger.log("error", { ubicacion: filename, token: token, err });
								res.json({
									error: err.errors
								});
							});
						})
						.catch(err => {
							logger.log("error", { ubicacion: filename, token: token, err });
							res.json({
								error: err.errors
							});
						});
				})
		})
};

exports.detalle_empresa = (req, res) => {
	var logger = req.app.get("winston");
	var redis = req.app.get("redis");
	const token = req.header("Authorization").split(" ")[1];

	utils.decodeToken(token, tokenDecodificado => {
		//OBTENER DATOS DEL USUARIO DESDE REDIS
		redis.get(tokenDecodificado.id, (err, usuario) => {
			usuario = JSON.parse(usuario);
			var empresa_codigo = req.body.empresa_codigo;
			var opcion = req.body.opcion;
			var fecha_inicio = req.body.fecha_inicio;
			var fecha_final = req.body.fecha_final;
			models.sequelize
				.query(
					`select * from giros_empresa('` + empresa_codigo + `','','` + fecha_inicio + ' 00:00:00.000+00'+ `','` + fecha_final + ' 23:59:59.000+00' + `');`, {
						type: models.sequelize.QueryTypes.SELECT
					}
				)
				.then(lista1 => {
					models.sequelize
						.query(
							`select * from orden_pago_empresa('` + empresa_codigo + `','','` + fecha_inicio + `','` + fecha_final + `');`, {
								type: models.sequelize.QueryTypes.SELECT
							}
						)
							.then(lista2 => {
								models.sequelize
									.query(
										`select * from recibos_empresa2('` + empresa_codigo + `','','` + fecha_inicio + `','` + fecha_final + `');`, {
											type: models.sequelize.QueryTypes.SELECT
										}
									)
									.then(lista3 => {
										models.sequelize
										.query(
											`select * from servicios_empresa('` + empresa_codigo + `','` + fecha_inicio + `','` + fecha_final + `');`, {
											type: models.sequelize.QueryTypes.SELECT
										})
										.then(lista4 => {
											var lista = {
												transferencias: lista1,
												ordenesPago: lista2,
												recibos: lista3,
												servicios: lista4
											};
											res.json(lista);
										})
										.catch(err => {
											logger.log("error", { ubicacion: filename, token: token, err });
											res.json({
												error: err.errors
											});
										})
									})
									.catch(err => {
										logger.log("error", { ubicacion: filename, token: token, err });
										res.json({
											error: err.errors
										});
									})
							})
							.catch(err => {
								logger.log("error", { ubicacion: filename, token: token, err });
								res.json({
									error: err.errors
								});
							})
							.catch(err => {
								logger.log("error", { ubicacion: filename, token: token, err });
								res.json({
									error: err.errors
								});
							});
						})
						.catch(err => {
							logger.log("error", { ubicacion: filename, token: token, err });
							res.json({
								error: err.errors
							});
						});
				})
		})
};

exports.resumen_saldos = (req, res) => {
	var logger = req.app.get("winston");
	var redis = req.app.get("redis");	
	const token = req.header("Authorization").split(" ")[1];
	utils.decodeToken(token, tokenDecodificado => {
		//OBTENER DATOS DEL USUARIO DESDE REDIS
		redis.get(tokenDecodificado.id, async(err, usuario) => {
			usuario = JSON.parse(usuario);

			models.sequelize
			.query(
				`select * from resumen_saldos()`,
			  {
				type: models.sequelize.QueryTypes.SELECT
			  }
			)
			.then(totales => {
			  res.json(totales);
			})
			.catch(err => {
			  logger.log("error", { ubicacion: filename, token: token, message : err.message });
			  res.status(409).send("Error");
			  console.log(err)
			});
		})
	})  	
}

exports.resumen_saldos2 = (req, res) => {
	var logger = req.app.get("winston");
	var redis = req.app.get("redis");	
	const token = req.header("Authorization").split(" ")[1];
	utils.decodeToken(token, tokenDecodificado => {
		//OBTENER DATOS DEL USUARIO DESDE REDIS
		redis.get(tokenDecodificado.id, async(err, usuario) => {
			usuario = JSON.parse(usuario);
			const opcion = req.params.opcion;
			models.sequelize
			.query(
				`select * from resumen_saldos1('${opcion}')`,
			  {
				type: models.sequelize.QueryTypes.SELECT
			  }
			)
			.then(totales => {
			  res.json(totales);
			})
			.catch(err => {
			  logger.log("error", { ubicacion: filename, token: token, message : err.message });
			  res.status(409).send("Error");
			  console.log(err)
			});
		})
	})  	
}

exports.resumenDetalle = (req, res) => {
	var logger = req.app.get("winston");
	var redis = req.app.get("redis");	
	const token = req.header("Authorization").split(" ")[1];
	utils.decodeToken(token, tokenDecodificado => {
		//OBTENER DATOS DEL USUARIO DESDE REDIS
		redis.get(tokenDecodificado.id, async(err, usuario) => {
			usuario = JSON.parse(usuario);
			var oficina = req.body.oficina;
			var fecha_inicio = req.body.fecha_inicio;
			var fecha_final = req.body.fecha_final;
			models.sequelize
			.query(
				`select * from resumen_Detalle('${fecha_inicio}','${fecha_final}','${oficina}')`,
			  {
				type: models.sequelize.QueryTypes.SELECT
			  }
			)
			.then(totales => {
			  res.json(totales);
			})
			.catch(err => {
			  logger.log("error", { ubicacion: filename, token: token, message : err.message });
			  res.status(409).send("Error");
			  console.log(err)
			});
		})
	})  	
}

//--PDF
exports.listaresumensaldos = (req, res) => {
	var logger = req.app.get("winston");
	var redis = req.app.get("redis");
	const token = req.header("Authorization").split(" ")[1];
	utils.decodeToken(token, tokenDecodificado => {
		//OBTENER DATOS DEL USUARIO DESDE REDIS
		redis.get(tokenDecodificado.id, async(err, usuario) => {
			usuario = JSON.parse(usuario);
			const opcion = req.params.opcion;
			models.sequelize
			.query(`SELECT * from resumen_saldos()`, {
				type: models.sequelize.QueryTypes.SELECT
			})
			.then(lista => {
				var propios = [];
				var afiliados = [];
				var sumsolesP=0.00;
				var sumdolaresP=0.00; 
				var gPendP=0;
				var montoPendP=0.00;  
				var sumsaldoA=0.00;
				var sumpendientesA=0.00;
				var gPendA=0;
				var montoPendA=0.00; 
				lista.map(resp => {
					if(resp.oficina_tipo === "Propio"){
						propios.push(resp);
					}					
				})
				models.sequelize
					.query(`SELECT * from resumen_saldos1(${opcion})`, {
						type: models.sequelize.QueryTypes.SELECT
					})
					.then(lista2 => {
						lista2.map(resp => {
							if(resp.oficina_tipo === "Afiliado"){
								afiliados.push(resp);
							}
						})						
					
				var ops = propios.map(function(item) {
					let propiosValores = Object.values(item);
					propiosValores[0] = {
						text: propiosValores[1],
						noWrap: false,
						alignment: "left"
					};
					propiosValores[1] = {
						text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(propiosValores[3]),
						noWrap: false,
						alignment: "right"
					};
					propiosValores[2] = {
						text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(propiosValores[4]),
						noWrap: false,
						alignment: "right"
					};
					propiosValores[3] = {
						text: propiosValores[5],
						noWrap: false,
						alignment: "right"
					};
					propiosValores[4] = {
						text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(propiosValores[6]),
						noWrap: true,
						alignment: "right"
					};			
					propiosValores.splice(5,3);
					return propiosValores;
				});

				for(var i=0;i<propios.length;i++){
					sumsolesP+= parseFloat(propios[i].soles);
					sumdolaresP+= parseFloat(propios[i].dolares);
					gPendP+=parseFloat(propios[i].cantidad);
					montoPendP+=parseFloat(propios[i].monto);
				}

				var ops2 = afiliados.map(function(item) {
					let afiliadosValores = Object.values(item);
					afiliadosValores[0] = {
						text: afiliadosValores[1],
						noWrap: false,
						alignment: "left"
					};
					afiliadosValores[1] = {
						text: afiliadosValores[3] === "CONTABLE" 
							? Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(afiliadosValores[4]) :
							Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(afiliadosValores[5]),
						//noWrap: true,
						alignment: "right"
					};
					/*afiliadosValores[2] = {
						text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(afiliadosValores[6]),
						noWrap: false,
						alignment: "right"
					};*/
					afiliadosValores[2] = {
						text: afiliadosValores[7],
						noWrap: false,
						alignment: "right"
					};
					afiliadosValores[3] = {
						text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(afiliadosValores[8]),
						//noWrap: true,
						alignment: "right"
					};					
					afiliadosValores.splice(4);
					return afiliadosValores;
					});

					for(var i=0;i<afiliados.length;i++){
						sumsaldoA= afiliados[i].tipo_arreglo === "CONTABLE" ? 
									sumsaldoA+parseFloat(afiliados[i].saldo_contable)
									: sumsaldoA + parseFloat(afiliados[i].saldo_real);
						sumpendientesA+=parseFloat(afiliados[i].pendientes)
						gPendA+=parseFloat(afiliados[i].cantidad);
						montoPendA+=parseFloat(afiliados[i].monto);
					}

					var fonts = {
						Helvetica: {
							normal: "Helvetica",
							bold: "Helvetica-Bold",
							italics: "Helvetica-Oblique",
							bolditalics: "Helvetica-BoldOblique"
						}
					};
					
					var docDefinition = {
						defaultStyle: {
							font: "Helvetica"
						},
						header: function(currentPage, pageCount, pageSize) {
							// you can apply any logic and return any valid pdfmake element
							return [
							{
								text: [`Pág. ${currentPage}/${pageCount}`],
								style: "header",
								alignment: currentPage % 2 ? "right" : "left"
							},
							{
								text: [
								moment()
									.locale("es")
									.format("LLLL")
								],
								style: "header",
								alignment: currentPage % 2 ? "right" : "left",
								margin: [20, 0, 20, 0]
							},
							{
								canvas: [
								{
									type: "rect",
									x: 170,
									y: 32,
									w: pageSize.width - 170,
									h: 40
								}
								]
							}
						];
						},
							//pageMArgins:[Left, Top, Right, Bottom]
							pageMargins: [20, 40, 20, 40],
							content: [
								{
								text: "Resumen Saldos",
								style: "titulo"
								},
								{
									text : "Oficinas Propias",
									style: "subtitulo"
								},
								{
									style: "tabla",
									table: {		
										// headers are automatically repeated if the table spans over multiple pages
										// you can declare how many rows should be treated as headers
										headerRows: 1,
										// ANCHO DE  CADA COLUMNA
										widths: ["auto",40, 40, 30, 40],
										body: [
											["Oficina", {text:"Soles",alignment: "right"}, {text:"Dólares",alignment: "right"},
											{text:"Cantidad G.Pend.",alignment: "right"},{text:"Monto G.Pend.",alignment: "right"}],
											...ops,
											["",
											{text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumsolesP)}`,
												noWrap: true,
												alignment: "right"},
											{text:`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumdolaresP)}`,
												noWrap: true,
												alignment: "right"},
											{text:`${gPendP}`,
												noWrap: true,
												alignment: "right"},
											{text:`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(montoPendP)}`,
												noWrap: true,
												alignment: "right"}]
										]
									},
									layout: {
										hLineWidth: function(i, node) {
										return i === 1 || i === node.table.body.length-1 ? 1 : 0;
									},
									vLineWidth: function(i, node) {
										return 0;
									},
									hLineColor: function(i, node) {
										return i === 0 || i === node.table.body.length-1 ? "black" : "gray";
									},
									// vLineColor: function (i, node) {return (i === 0 || i === node.table.widths.length) ? 'black' : 'gray';},
									// hLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
									// vLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
									paddingLeft: function(i, node) {
										return 4;
									},
									paddingRight: function(i, node) {
										return 0;
									},
									// paddingTop: function(i, node) { return 2; },
									// paddingBottom: function(i, node) { return 2; },
									// fillColor: function (rowIndex, node, columnIndex) { return null; }
									fillColor: function(rowIndex, node, columnIndex) {
										return rowIndex > 0 && rowIndex % 2 === 1 ? "#e6e6e6" : null;
										}
									}
								},
								{
									text : "Oficinas Afiliadas",
									style: "subtitulo"},
								{
									style: "tabla2",
									table: {		
										// headers are automatically repeated if the table spans over multiple pages
										// you can declare how many rows should be treated as headers
										headerRows: 1,
										// ANCHO DE  CADA COLUMNA
										widths: [100,60, 40, 70],
										body: [
											["Oficina", {text:"Saldo",alignment: "right"}, /*{text:"Pendientes",alignment: "right"},*/
											{text:"Cantidad G.Pend.",alignment: "right"},{text:"Monto G.Pend.",alignment: "right"}],
											...ops2,
											["",
											{text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumsaldoA)}`,
												//noWrap: true,
												alignment: "right"},
												/*{text:`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumpendientesA)}`,
												noWrap: true,
												alignment: "right"},*/
											{text:`${gPendA}`,
												//noWrap: true,
												alignment: "right"},
											{text:`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(montoPendA)}`,
												//noWrap: true,
												alignment: "right"}]
											]
									},
									layout: {
										hLineWidth: function(i, node) {
											return i === 1 || i === node.table.body.length-1 ? 1 : 0;
										},
										vLineWidth: function(i, node) {
											return 0;
										},
										hLineColor: function(i, node) {
											return i === 0 || i === node.table.body.length-1 ? "black" : "gray";
										},
										// vLineColor: function (i, node) {return (i === 0 || i === node.table.widths.length) ? 'black' : 'gray';},
										// hLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
										// vLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
										paddingLeft: function(i, node) {
											return 4;
										},
										paddingRight: function(i, node) {
											return 0;
										},
										// paddingTop: function(i, node) { return 2; },
										// paddingBottom: function(i, node) { return 2; },
										// fillColor: function (rowIndex, node, columnIndex) { return null; }
										fillColor: function(rowIndex, node, columnIndex) {
											return rowIndex > 0 && rowIndex % 2 === 1 ? "#e6e6e6" : null;
										}
									}
								}
							],
							styles: {
								header: {
								fontSize: 10,
								margin: [20, 10, 20, 0]
								},
								leyenda: {
								fontSize: 8,
								margin: [10, 10, 0, 0]
								},
								tabla: {
								margin: [140, 0, 50, 0],
								fontSize: 7
								},
								tabla2: {
								margin: [120, 0, 0, 0],
								fontSize: 7
								},
								titulo: {
								fontSize: 18,
								bold: true,
								alignment: "center",
								margin: [0, 10, 0, 4]
								},
								subtitulo: {
								fontSize: 13,
								bold: true,
								alignment: "center",
								margin: [0, 20, 0, 4]
								},
								oficina: {
								fontSize: 10,
								bold: true,
								alignment: "center",
								margin: [0, 0, 0, 10]
								},
								rangoFecha: {
								fontSize: 9,
								bold: false,
								alignment: "center",
								margin: [0, 0, 0, 15]
								},
								saldos: {
								fontSize: 8,
								bold: true,
								alignment: "left",
								margin: [20, 0, 0, 8]
								},
								monto: {
								fontSize: 8,
								bold: false,
								alignment: "right"
								}
							}
							};
							var printer = new PdfPrinter(fonts);
							var now = new Date();
							var pdfDoc = printer.createPdfKitDocument(docDefinition);
							var chunks = [];
							var result;
					
							pdfDoc.on("data", function(chunk) {
							chunks.push(chunk);
							});
							pdfDoc.on("end", function() {
							result = Buffer.concat(chunks);
							res.contentType("application/pdf");
							res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
							res.setHeader("Content-Disposition", `attachment; filename=ResumenSaldos_${moment().locale("es").format("DD-MM-YYYY_HH'mm")}.pdf`);
							res.send(result);
							});
							pdfDoc.end();			
						})
				
			})
			.catch(err => {
				logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
				res.status(409).send("Error al generar");
				console.log(err)
			});
	})
	})
};

exports.listaDetalleCaja = (req, res) => {
	var logger = req.app.get("winston");
	var redis = req.app.get("redis");
	const token = req.header("Authorization").split(" ")[1];
	utils.decodeToken(token, tokenDecodificado => {
		//OBTENER DATOS DEL USUARIO DESDE REDIS
		redis.get(tokenDecodificado.id, async(err, usuario) => {
			usuario = JSON.parse(usuario);
			var caja_codigo1 = req.body.caja_codigo ? req.body.caja_codigo : usuario.caja_codigo;
			var opcion = "*";
			const fechai = req.body.fecha_inicio;
			const fechaf = req.body.fecha_final;
			let caja_nombre = "";
			let nombre= "";
			const caja = await models.caja.findOne({
				where: {
				caja_codigo: caja_codigo1
				}
			});
			nombre = caja.caja_nombre;
			caja_nombre = caja.caja_nombre.replace(/ /g, "_");
		
			models.sequelize
			.query(`SELECT * from giros('${caja_codigo1}','${opcion}', '${fechai}', '${fechaf}')`, {
				type: models.sequelize.QueryTypes.SELECT
			})
			.then(lista => {
				var ops = lista.map(function(item) {
				let arrValores = Object.values(item);
				arrValores[0] = {
					text: arrValores[0],
					noWrap: true,
					alignment: "right"
				};
				arrValores[1] = {
					text: arrValores[1],
					noWrap: true,
					fillColor:
					arrValores[7] === 2
						? "#c0ffbd"
						: arrValores[7] === 1
						? "#fff9bd"
						: arrValores[7] === 3
						? "#a9a9a9"
						: arrValores[7] === 4
						? "#ffbdbd"
						: null
				};
				arrValores[2] = {
					text: arrValores[2],
					noWrap: true,
					alignment: "left"
				};
				arrValores[3] = {
					text: arrValores[3],
					noWrap: false
				};
				arrValores[4] = {
					text: arrValores[4],
					noWrap: false
				};
				arrValores[5] = {
					text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores[5]),
					noWrap: true,
					alignment: "right"
				};
				arrValores[6] = {
					text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores[6]),
					noWrap: true,
					alignment: "right"
				};
				arrValores.splice(7);
				return arrValores;
				});

				models.sequelize
				.query(`SELECT * from orden_pago('${caja_codigo1}','${opcion}', '${fechai}', '${fechaf}')`, {
					type: models.sequelize.QueryTypes.SELECT
				})
				.then(lista2 => {
					var sumS1=0.00;
					var sumD1=0.00;
					var sumS=0.00;
					var sumD=0.00;
					var sumIngS=0.00;
					var sumIngD=0.00;
					var sumEgS=0.00;
					var sumEgD=0.00;
					var SersumIngS=0.00;						
					var SersumIngD=0.00;
					var SersumEgS=0.00;
					var SersumEgD=0.00;

					var ops2 = lista2.map(function(item) {
					let arrValores2 = Object.values(item);
					arrValores2[0] = {
						text: arrValores2[0],
						noWrap: true,
						alignment: "right"
					};
					arrValores2[1] = {
						text: arrValores2[1],
						noWrap: true,
						fillColor:
						arrValores2[7] === 2
							? "#c0ffbd"
							: arrValores2[7] === 1
							? "#fff9bd"
							: arrValores[7] === 3
							? "#a9a9a9"
							: arrValores2[7] === 4
							? "#ffbdbd"
							: null
					};
					arrValores2[2] = {
						text: arrValores2[2],
						noWrap: true,
						alignment: "right"
					};
					arrValores2[3] = {
						text: arrValores2[3],
						noWrap: false
					};
					arrValores2[4] = {
						text: arrValores2[4],
						noWrap: false
					};
					arrValores2[5] = {
						text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores2[5]),
						noWrap: true,
						alignment: "right"
					};
					arrValores2[6] = {
						text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores2[6]),
						noWrap: true,
						alignment: "right"
					};
					arrValores2.splice(7);
					return arrValores2;
					});
					for(var i=0;i<lista.length;i++){
						sumS1=sumS1+ parseFloat(lista[i].importe_soles);						
						sumD1=sumD1+ parseFloat(lista[i].importe_dolares);
					}

					for(var i=0;i<lista2.length;i++){
						sumS=sumS+ parseFloat(lista2[i].importe_soles);						
						sumD=sumD+ parseFloat(lista2[i].importe_dolares);
					}
					models.sequelize
					.query(`SELECT * from recibos2('${caja_codigo1}','${opcion}', '${fechai}', '${fechaf}')`, {
						type: models.sequelize.QueryTypes.SELECT
					})
					.then(lista3 => {
						var ops3 = lista3.map(function(item) {
						let arrValores3 = Object.values(item);
						arrValores3[0] = {
							text: arrValores3[0],
							noWrap: true,
							alignment: "right"
						};
						arrValores3[1] = {
							text: arrValores3[1]+arrValores3[2],
							noWrap: false
						};
						arrValores3[2] = {
							text: arrValores3[3],
							noWrap: false
						};
						arrValores3[3] = {
							text: arrValores3[4],
							noWrap: false
						};
						arrValores3[4] = {
							text: arrValores3[5],
							noWrap: false
						};
						//-----
						arrValores3[5] = {
							text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores3[6]),
							noWrap: true,
							alignment: "right"
						};
						arrValores3[6] = {
							text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores3[7]),
							noWrap: true,
							alignment: "right"
						};
						arrValores3[7] = {
							text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores3[8]),
							noWrap: true,
							alignment: "right"
						};
						arrValores3[8] = {
							text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores3[9]),
							noWrap: true,
							alignment: "right"
						};
						arrValores3.splice(9);
						return arrValores3;
						});

						for(var i=0;i<lista3.length;i++){
							sumIngS=sumIngS+ parseFloat(lista3[i].moneda1_ingre);						
							sumIngD=sumIngD+ parseFloat(lista3[i].moneda2_ingre);
							sumEgS=sumEgS+ parseFloat(lista3[i].moneda1_egre);
							sumEgD=sumEgD+ parseFloat(lista3[i].moneda2_egre);
						}
						models.sequelize
						.query(`SELECT * from servicios_caja('${caja_codigo1}', '${fechai}', '${fechaf}')`, {
							type: models.sequelize.QueryTypes.SELECT
						})
						.then(lista4 => {
							var ops4 = lista4.map(function(item) {
							let arrValores4 = Object.values(item);
							arrValores4[0] = {
								text: arrValores4[0],
								noWrap: true,
								alignment: "right"
							};
							arrValores4[1] = {
								text: arrValores4[1]+arrValores4[2],
								noWrap: false
							};
							arrValores4[2] = {
								text: arrValores4[3],
								noWrap: false
							};
							arrValores4[3] = {
								text: arrValores4[4],
								noWrap: false
							};
							arrValores4[4] = {
								text: arrValores4[5],
								noWrap: false
							};
							//-----
							arrValores4[5] = {
								text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores4[6]),
								noWrap: true,
								alignment: "right"
							};
							arrValores4[6] = {
								text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores4[7]),
								noWrap: true,
								alignment: "right"
							};
							arrValores4[7] = {
								text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores4[8]),
								noWrap: true,
								alignment: "right"
							};
							arrValores4[8] = {
								text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores4[9]),
								noWrap: true,
								alignment: "right"
							};
							arrValores4.splice(9);
							return arrValores4;
							});

							for(var i=0;i<lista4.length;i++){
								SersumIngS=SersumIngS+ parseFloat(lista4[i].moneda1_ingre);						
								SersumIngD=SersumIngD+ parseFloat(lista4[i].moneda2_ingre);
								SersumEgS=SersumEgS+ parseFloat(lista4[i].moneda1_egre);
								SersumEgD=SersumEgD+ parseFloat(lista4[i].moneda2_egre);
							}

							models.sequelize
							.query(`SELECT * from saldos_caja2('${fechai}','${fechaf}','${caja_codigo1}')`, {
								type: models.sequelize.QueryTypes.SELECT
							})
							.then(listasaldos => {

							//-----------		
							var fonts = {
								Helvetica: {
									normal: "Helvetica",
									bold: "Helvetica-Bold",
									italics: "Helvetica-Oblique",
									bolditalics: "Helvetica-BoldOblique"
								}
								};
						
								var docDefinition = {
								defaultStyle: {
									font: "Helvetica"
								},
								header: function(currentPage, pageCount, pageSize) {
									// you can apply any logic and return any valid pdfmake element
									return [
									{
										text: [`Pág. ${currentPage}/${pageCount}`],
										style: "header",
										alignment: currentPage % 2 ? "right" : "left"
									},
									{
										text: [
										moment()
											.locale("es")
											.format("LLLL")
										],
										style: "header",
										alignment: currentPage % 2 ? "right" : "left",
										margin: [20, 0, 20, 0]
									},
									{
										canvas: [
										{
											type: "rect",
											x: 170,
											y: 32,
											w: pageSize.width - 170,
											h: 40
										}
										]
									}
									];
								},
								//pageMArgins:[Left, Top, Right, Bottom]
								pageMargins: [20, 40, 20, 40],
								content: [
									{
									text: "Detalle Caja",
									style: "titulo"
									},								
									{
										text: nombre,
										style: "oficina"
									},
									{
										text: ` Del ${fechai} Al ${fechaf}`,
										style: "rangoFecha"
									},
									{
										columns: [
											{
											// auto-sized columns have their widths based on their content
											width: 120,
											text: 'SALDO ANTERIOR :',
											style: "saldos"
											},
											{
											// star-sized columns fill the remaining space
											// if there's more than one star-column, available width is divided equally
											width: 80,
											text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(listasaldos[0].soles_anterior)}`,
											style: "monto"
											},
											{
											// fixed width
											width: 'auto',
											text: 'SOLES',
											style: "saldos"
											},
											{
											// star-sized columns fill the remaining space
											// if there's more than one star-column, available width is divided equally
											width: 80,
											text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(listasaldos[0].dolares_anterior)}`,
											style: "monto"
											},
											{
											// fixed width
											width: 'auto',
											text: 'DOLARES',
											style: "saldos"
											}
										]
									},
									{
										columns: [
											{
											// auto-sized columns have their widths based on their content
											width: 120,
											text: 'SALDO FINAL :',
											style: "saldos"
											},
											{
											// star-sized columns fill the remaining space
											// if there's more than one star-column, available width is divided equally
											width: 80,
											text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(listasaldos[0].soles_final)}`,
											style: "monto"
											},
											{
											// fixed width
											width: 'auto',
											text: 'SOLES',
											style: "saldos"
											},
											{
											// star-sized columns fill the remaining space
											// if there's more than one star-column, available width is divided equally
											width: 80,
											text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(listasaldos[0].dolares_final)}`,
											style: "monto"
											},
											{
											// fixed width
											width: 'auto',
											text: 'DOLARES',
											style: "saldos"
											}
										]
									},
									{
									style: "leyenda",
									table: {
										// headers are automatically repeated if the table spans over multiple pages
										// you can declare how many rows should be treated as headers
										headerRows: 1,
										// ANCHO DE  CADA COLUMNA
										widths: ["auto", "auto", "auto","auto", "auto"],
										body: [
										[
											"LEYENDA",
											{
											text: "PENDIENTE",
											color: "#f7e100"
											},
											{
											text: "PAGADO",
											color: "#0cff00"
											},
											{
											text: "REEMBOLSO",
											color: "#a9a9a9"
											},
											{
											text: "ANULADO",
											color: "#ff0000"
											}
										]
										]
									}
									},
									{
										text: "Giros Recaudados",
										style: "subtitulo"
									},
									{
									style: "tabla",
									table: {
										// headers are automatically repeated if the table spans over multiple pages
										// you can declare how many rows should be treated as headers
										headerRows: 1,
										// ANCHO DE  CADA COLUMNA
										widths: ["auto","auto","auto", "*", "*", "auto", "auto"],
										body: [
										["Nro","Destino", "Nro Boleta", "Beneficiario", "Solicitante", "Importe S/.", "Importe $"],
										...ops,
										["","","","","TOTAL",
											{text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumS1)}`,
												noWrap: true,
												alignment: "right"},
											{text:`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumD1)}`,
												noWrap: true,
												alignment: "right"}]
										]
									},
									layout: {
										hLineWidth: function(i, node) {
										return i === 1 || i === node.table.body.length-1 ? 1 : 0;
										},
										vLineWidth: function(i, node) {
										return 0;
										},
										hLineColor: function(i, node) {
										return i === 0 || i === node.table.body.length-1 ? "black" : "gray";
										},
										// vLineColor: function (i, node) {return (i === 0 || i === node.table.widths.length) ? 'black' : 'gray';},
										// hLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
										// vLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
										paddingLeft: function(i, node) {
										return 4;
										},
										paddingRight: function(i, node) {
										return 0;
										},
										// paddingTop: function(i, node) { return 2; },
										// paddingBottom: function(i, node) { return 2; },
										// fillColor: function (rowIndex, node, columnIndex) { return null; }
										fillColor: function(rowIndex, node, columnIndex) {
										return rowIndex > 0 && rowIndex % 2 === 1 ? "#e6e6e6" : null;
										}
									}
									},
									//------
									{
										text: "Giros Pagados",
										style: "subtitulo"
									},
									{
										style: "tabla",
										table: {
											// headers are automatically repeated if the table spans over multiple pages
											// you can declare how many rows should be treated as headers
											headerRows: 1,
											// ANCHO DE  CADA COLUMNA
											widths: ["auto","auto","auto", "*", "*", "auto", "auto"],
											body: [
											["Nro","Destino", "Nro Boleta", "Beneficiario", "Solicitante", "Importe S/.", "Importe $"],
											...ops2,
											["","","","","TOTAL",
												{text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumS)}`,
													noWrap: true,
													alignment: "right"},
												{text:`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumD)}`,
													noWrap: true,
													alignment: "right"}]
											]
										},
										layout: {
											hLineWidth: function(i, node) {
											return i === 1 || i === node.table.body.length-1 ? 1 : 0;
											},
											vLineWidth: function(i, node) {
											return 0;
											},
											hLineColor: function(i, node) {
											return i === 0 || i === node.table.body.length-1 ? "black" : "gray";
											},
											// vLineColor: function (i, node) {return (i === 0 || i === node.table.widths.length) ? 'black' : 'gray';},
											// hLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
											// vLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
											paddingLeft: function(i, node) {
											return 4;
											},
											paddingRight: function(i, node) {
											return 0;
											},
											// paddingTop: function(i, node) { return 2; },
											// paddingBottom: function(i, node) { return 2; },
											// fillColor: function (rowIndex, node, columnIndex) { return null; }
											fillColor: function(rowIndex, node, columnIndex) {
											return rowIndex > 0 && rowIndex % 2 === 1 ? "#e6e6e6" : null;
											}
										}
									},
									{
										text: "Recibos Internos",
										style: "subtitulo"
									},
									{
										style: "tabla",
										table: {
											// headers are automatically repeated if the table spans over multiple pages
											// you can declare how many rows should be treated as headers
											headerRows: 2,
											// ANCHO DE  CADA COLUMNA
											widths: ["auto","auto","auto","*", "*", "auto", "auto", "auto","auto"],
											body: [
											[	"",						
												"",
												"",
												"",
												"",
												{
												text: "Soles",
												colSpan: 2,
												alignment: "center"
												},
												{},
												{
												text: "Dolares",
												colSpan: 2,
												alignment: "center"
												},
												{}
											],
											["Nro","Documento","Oficina Origen","Concepto", "Razón Social", "Ingreso", "Egreso", "Ingreso","Egreso"],
											...ops3,
											["","","","","TOTAL",
												{text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumIngS)}`,
													noWrap: true,
													alignment: "right"},
												{text:`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumEgS)}`,
													noWrap: true,
													alignment: "right"},
												{text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumIngD)}`,
													noWrap: true,
													alignment: "right"},
												{text:`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumEgD)}`,
													noWrap: true,
													alignment: "right"},
												]
											]
										},
										layout: {
											hLineWidth: function(i, node) {
											return i === 2 || i === node.table.body.length-1 ? 1 : 0;
											},
											vLineWidth: function(i, node) {
											return 0;
											},
											hLineColor: function(i, node) {
											return i === 0 || i === node.table.body.length-1 ? "black" : "gray";
											},
											// vLineColor: function (i, node) {return (i === 0 || i === node.table.widths.length) ? 'black' : 'gray';},
											// hLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
											// vLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
											paddingLeft: function(i, node) {
											return 4;
											},
											paddingRight: function(i, node) {
											return 0;
											},
											// paddingTop: function(i, node) { return 2; },
											// paddingBottom: function(i, node) { return 2; },
											// fillColor: function (rowIndex, node, columnIndex) { return null; }
											fillColor: function(rowIndex, node, columnIndex) {
											return rowIndex > 2 && rowIndex % 2 === 1 ? "#e6e6e6" : null;
											}
										}
									},
									{
										text: "Servicios",
										style: "subtitulo"
									},
									{
										style: "tabla",
										table: {
											// headers are automatically repeated if the table spans over multiple pages
											// you can declare how many rows should be treated as headers
											headerRows: 2,
											// ANCHO DE  CADA COLUMNA
											widths: ["auto","auto","auto","*", "*", "auto", "auto", "auto","auto"],
											body: [
											[	"",						
												"",
												"",
												"",
												"",
												{
												text: "Soles",
												colSpan: 2,
												alignment: "center"
												},
												{},
												{
												text: "Dolares",
												colSpan: 2,
												alignment: "center"
												},
												{}
											],
											["Nro","Documento","Oficina Origen","Entidad", "Razón Social", "Ingreso", "Egreso", "Ingreso","Egreso"],
											...ops4,
											["","","","","TOTAL",
												{text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(SersumIngS)}`,
													noWrap: true,
													alignment: "right"},
												{text:`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(SersumEgS)}`,
													noWrap: true,
													alignment: "right"},
												{text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(SersumIngD)}`,
													noWrap: true,
													alignment: "right"},
												{text:`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(SersumEgD)}`,
													noWrap: true,
													alignment: "right"},
												]
											]
										},
										layout: {
											hLineWidth: function(i, node) {
											return i === 2 || i === node.table.body.length-1 ? 1 : 0;
											},
											vLineWidth: function(i, node) {
											return 0;
											},
											hLineColor: function(i, node) {
											return i === 0 || i === node.table.body.length-1 ? "black" : "gray";
											},
											// vLineColor: function (i, node) {return (i === 0 || i === node.table.widths.length) ? 'black' : 'gray';},
											// hLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
											// vLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
											paddingLeft: function(i, node) {
											return 4;
											},
											paddingRight: function(i, node) {
											return 0;
											},
											// paddingTop: function(i, node) { return 2; },
											// paddingBottom: function(i, node) { return 2; },
											// fillColor: function (rowIndex, node, columnIndex) { return null; }
											fillColor: function(rowIndex, node, columnIndex) {
											return rowIndex > 2 && rowIndex % 2 === 1 ? "#e6e6e6" : null;
											}
										}
									}
									//------

								],
								styles: {
									header: {
									fontSize: 10,
									margin: [20, 10, 20, 0]
									},
									leyenda: {
									fontSize: 8,
									margin: [10, 10, 0, 0]
									},
									tabla: {
									//margin: [10, 0, 10, 0],
									fontSize: 7
									},
									titulo: {
									fontSize: 18,
									bold: true,
									alignment: "center",
									margin: [0, 10, 0, 4]
									},
									subtitulo: {
									fontSize: 13,
									bold: true,
									alignment: "center",
									margin: [0, 20, 0, 4]
									},
									oficina: {
									fontSize: 10,
									bold: true,
									alignment: "center",
									margin: [0, 0, 0, 10]
									},
									rangoFecha: {
									fontSize: 9,
									bold: false,
									alignment: "center",
									margin: [0, 0, 0, 15]
									},
									saldos: {
									fontSize: 8,
									bold: true,
									alignment: "left",
									margin: [20, 0, 0, 8]
									},
									monto: {
									fontSize: 8,
									bold: false,
									alignment: "right"
									}
								}
								};
								var printer = new PdfPrinter(fonts);
								var now = new Date();
								var pdfDoc = printer.createPdfKitDocument(docDefinition);
								var chunks = [];
								var result;
						
								pdfDoc.on("data", function(chunk) {
								chunks.push(chunk);
								});
								pdfDoc.on("end", function() {
								result = Buffer.concat(chunks);
								res.contentType("application/pdf");
								res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
								res.setHeader("Content-Disposition", `attachment; filename=DetalleCaja_${caja_codigo1}_${moment().locale("es").format("DD-MM-YYYY_HH'mm")}.pdf`);
								res.send(result);
								});
								pdfDoc.end();
							})
						})
					})

				})				
				
			})
			.catch(err => {
				logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
				res.status(409).send("Error al generar");
				console.log(err)
			});
	})
	})
};

exports.listaDetalleOficina = (req, res) => {
	var logger = req.app.get("winston");
	var redis = req.app.get("redis");
	const token = req.header("Authorization").split(" ")[1];
	utils.decodeToken(token, tokenDecodificado => {
		//OBTENER DATOS DEL USUARIO DESDE REDIS
		redis.get(tokenDecodificado.id, async(err, usuario) => {
			usuario = JSON.parse(usuario);
			var oficina_codigo1 = req.body.oficina_codigo;
			var opcion = "*";
			const fechai = req.body.fecha_inicio;
			const fechaf = req.body.fecha_final;
			let oficina_nombre = "";
			let nombre= "";
			const oficina = await models.oficina.findOne({
				where: {
				oficina_codigo: oficina_codigo1
				}
			});
			nombre = oficina.oficina_nombre;
			oficina_nombre = oficina.oficina_nombre.replace(/ /g, "_");
		
			models.sequelize
			.query(`SELECT * from giros_oficina('${oficina_codigo1}','${opcion}', '${fechai}', '${fechaf}')`, {
				type: models.sequelize.QueryTypes.SELECT
			})
			.then(lista => {
				var ops = lista.map(function(item) {
				let arrValores = Object.values(item);
				arrValores[0] = {
					text: arrValores[0],
					noWrap: true,
					alignment: "right"
				  };
				arrValores[1] = {
					text: arrValores[1],
					noWrap: true,
					fillColor:
					arrValores[7] === 2
						? "#c0ffbd"
						: arrValores[7] === 1
						? "#fff9bd"
						: arrValores[7] === 3
						? "#a9a9a9"
						: arrValores[7] === 4
						? "#ffbdbd"
						: null
				};
				arrValores[2] = {
					text: arrValores[2],
					noWrap: true,
					alignment: "left"
				};
				arrValores[3] = {
					text: arrValores[3],
					noWrap: false
				};
				arrValores[4] = {
					text: arrValores[4],
					noWrap: false
				};
				arrValores[5] = {
					text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores[5]),
					noWrap: true,
					alignment: "right"
				};
				arrValores[6] = {
					text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores[6]),
					noWrap: true,
					alignment: "right"
				};
				arrValores.splice(7)
				//arrValores.pop();
				return arrValores;
				});

				models.sequelize
				.query(`SELECT * from orden_pago_oficina('${oficina_codigo1}','${opcion}', '${fechai}', '${fechaf}')`, {
					type: models.sequelize.QueryTypes.SELECT
				})
				.then(lista2 => {
					var sumS1=0.00;
					var sumD1=0.00;
					var sumS=0.00;
					var sumD=0.00;
					var sumIngS=0.00;
					var sumIngD=0.00;
					var sumEgS=0.00;
					var sumEgD=0.00;
					var SersumIngS=0.00;						
					var SersumIngD=0.00;
					var SersumEgS=0.00;
					var SersumEgD=0.00;
					var ops2 = lista2.map(function(item) {
					let arrValores2 = Object.values(item);
					arrValores2[0] = {
						text: arrValores2[0],
						noWrap: true,
						alignment: "right"
					  };
					arrValores2[1] = {
						text: arrValores2[1],
						noWrap: true,
						fillColor:
						arrValores2[7] === 2
							? "#c0ffbd"
							: arrValores2[7] === 1
							? "#fff9bd"
							: arrValores[7] === 3
							? "#a9a9a9"
							: arrValores2[7] === 4
							? "#ffbdbd"
							: null
					};
					arrValores2[2] = {
						text: arrValores2[2],
						noWrap: true,
						alignment: "right"
					};
					arrValores2[3] = {
						text: arrValores2[3],
						noWrap: false
					};
					arrValores2[4] = {
						text: arrValores2[4],
						noWrap: false
					};
					arrValores2[5] = {
						text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores2[5]),
						noWrap: true,
						alignment: "right"
					};
					arrValores2[6] = {
						text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores2[6]),
						noWrap: true,
						alignment: "right"
					};
					arrValores2.splice(7)
					//arrValores2.pop();
					return arrValores2;
					});
					for(var i=0;i<lista.length;i++){
						sumS1=sumS1+ parseFloat(lista[i].importe_soles);						
						sumD1=sumD1+ parseFloat(lista[i].importe_dolares);
					}

					for(var i=0;i<lista2.length;i++){
						sumS=sumS+ parseFloat(lista2[i].importe_soles);						
						sumD=sumD+ parseFloat(lista2[i].importe_dolares);
					}
					models.sequelize
					.query(`SELECT * from recibos_oficina2('${oficina_codigo1}','${opcion}', '${fechai}', '${fechaf}')`, {
						type: models.sequelize.QueryTypes.SELECT
					})
					.then(lista3 => {
						var ops3 = lista3.map(function(item) {
						let arrValores3 = Object.values(item);
						arrValores3[0] = {
							text: arrValores3[0],
							noWrap: true,
							alignment: "right"
						  };
						arrValores3[1] = {
							text: arrValores3[1]+arrValores3[2],
							noWrap: false
						};
						arrValores3[2] = {
							text: arrValores3[3],
							noWrap: false
						};
						arrValores3[3] = {
							text: arrValores3[4],
							noWrap: false
						};
						arrValores3[4] = {
							text: arrValores3[5],
							noWrap: false
						};
						//-----						
						arrValores3[5] = {
							text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores3[6]),
							noWrap: true,
							alignment: "right"
						};
						arrValores3[6] = {
							text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores3[7]),
							noWrap: true,
							alignment: "right"
						};
						arrValores3[7] = {
							text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores3[8]),
							noWrap: true,
							alignment: "right"
						};
						arrValores3[8] = {
							text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores3[9]),
							noWrap: true,
							alignment: "right"
						};
						arrValores3.splice(9)
						//arrValores3.pop();
						return arrValores3;
						});

						for(var i=0;i<lista3.length;i++){
							sumIngS=sumIngS+ parseFloat(lista3[i].moneda1_ingre);						
							sumIngD=sumIngD+ parseFloat(lista3[i].moneda2_ingre);
							sumEgS=sumEgS+ parseFloat(lista3[i].moneda1_egre);
							sumEgD=sumEgD+ parseFloat(lista3[i].moneda2_egre);
						}

						models.sequelize
						.query(`SELECT * from servicios_oficina('${oficina_codigo1}', '${fechai}', '${fechaf}')`, {
							type: models.sequelize.QueryTypes.SELECT
						})
						.then(lista4 => {
							var ops4 = lista4.map(function(item) {
							let arrValores4 = Object.values(item);
							arrValores4[0] = {
								text: arrValores4[0],
								noWrap: true,
								alignment: "right"
							};
							arrValores4[1] = {
								text: arrValores4[1]+arrValores4[2],
								noWrap: false
							};
							arrValores4[2] = {
								text: arrValores4[3],
								noWrap: false
							};
							arrValores4[3] = {
								text: arrValores4[4],
								noWrap: false
							};
							arrValores4[4] = {
								text: arrValores4[5],
								noWrap: false
							};
							//-----
							arrValores4[5] = {
								text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores4[6]),
								noWrap: true,
								alignment: "right"
							};
							arrValores4[6] = {
								text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores4[7]),
								noWrap: true,
								alignment: "right"
							};
							arrValores4[7] = {
								text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores4[8]),
								noWrap: true,
								alignment: "right"
							};
							arrValores4[8] = {
								text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores4[9]),
								noWrap: true,
								alignment: "right"
							};
							arrValores4.splice(9);
							return arrValores4;
							});

							for(var i=0;i<lista4.length;i++){
								SersumIngS=SersumIngS+ parseFloat(lista4[i].moneda1_ingre);						
								SersumIngD=SersumIngD+ parseFloat(lista4[i].moneda2_ingre);
								SersumEgS=SersumEgS+ parseFloat(lista4[i].moneda1_egre);
								SersumEgD=SersumEgD+ parseFloat(lista4[i].moneda2_egre);
							}

							models.sequelize
							.query(`SELECT * from saldos_oficina2('${fechai}','${fechaf}','${oficina_codigo1}')`, {
								type: models.sequelize.QueryTypes.SELECT
							})
							.then(listasaldos => {

							//-----------		
							var fonts = {
								Helvetica: {
									normal: "Helvetica",
									bold: "Helvetica-Bold",
									italics: "Helvetica-Oblique",
									bolditalics: "Helvetica-BoldOblique"
								}
								};
						
								var docDefinition = {
								defaultStyle: {
									font: "Helvetica"
								},
								header: function(currentPage, pageCount, pageSize) {
									// you can apply any logic and return any valid pdfmake element
									return [
									{
										text: [`Pág. ${currentPage}/${pageCount}`],
										style: "header",
										alignment: currentPage % 2 ? "right" : "left"
									},
									{
										text: [
										moment()
											.locale("es")
											.format("LLLL")
										],
										style: "header",
										alignment: currentPage % 2 ? "right" : "left",
										margin: [20, 0, 20, 0]
									},
									{
										canvas: [
										{
											type: "rect",
											x: 170,
											y: 32,
											w: pageSize.width - 170,
											h: 40
										}
										]
									}
									];
								},
								//pageMArgins:[Left, Top, Right, Bottom]
								pageMargins: [20, 40, 20, 40],
								content: [
									{
									text: "Detalle Caja",
									style: "titulo"
									},								
									{
										text: nombre,
										style: "oficina"
									},
									{
										text: ` Del ${fechai} Al ${fechaf}`,
										style: "rangoFecha"
									},
									{
										columns: [
											{
											// auto-sized columns have their widths based on their content
											width: 120,
											text: 'SALDO ANTERIOR :',
											style: "saldos"
											},
											{
											// star-sized columns fill the remaining space
											// if there's more than one star-column, available width is divided equally
											width: 80,
											text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(listasaldos[0].soles_anterior)}`,
											style: "monto"
											},
											{
											// fixed width
											width: 'auto',
											text: 'SOLES',
											style: "saldos"
											},
											{
											// star-sized columns fill the remaining space
											// if there's more than one star-column, available width is divided equally
											width: 80,
											text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(listasaldos[0].dolares_anterior)}`,
											style: "monto"
											},
											{
											// fixed width
											width: 'auto',
											text: 'DOLARES',
											style: "saldos"
											}
										]
									},
									{
										columns: [
											{
											// auto-sized columns have their widths based on their content
											width: 120,
											text: 'SALDO FINAL :',
											style: "saldos"
											},
											{
											// star-sized columns fill the remaining space
											// if there's more than one star-column, available width is divided equally
											width: 80,
											text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(listasaldos[0].soles_final)}`,
											style: "monto"
											},
											{
											// fixed width
											width: 'auto',
											text: 'SOLES',
											style: "saldos"
											},
											{
											// star-sized columns fill the remaining space
											// if there's more than one star-column, available width is divided equally
											width: 80,
											text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(listasaldos[0].dolares_final)}`,
											style: "monto"
											},
											{
											// fixed width
											width: 'auto',
											text: 'DOLARES',
											style: "saldos"
											}
										]
									},
									{
									style: "leyenda",
									table: {
										// headers are automatically repeated if the table spans over multiple pages
										// you can declare how many rows should be treated as headers
										headerRows: 1,
										// ANCHO DE  CADA COLUMNA
										widths: ["auto", "auto", "auto", "auto", "auto"],
										body: [
										[
											"LEYENDA",
											{
											text: "PENDIENTE",
											color: "#f7e100"
											},
											{
											text: "PAGADO",
											color: "#0cff00"
											},
											{
											text: "REEMBOLSO",
											color: "#a9a9a9"
											},
											{
											text: "ANULADO",
											color: "#ff0000"
											}
										]
										]
									}
									},
									{
										text: "Giros Recaudados",
										style: "subtitulo"
									},
									{
									style: "tabla",
									table: {
										// headers are automatically repeated if the table spans over multiple pages
										// you can declare how many rows should be treated as headers
										headerRows: 1,
										// ANCHO DE  CADA COLUMNA
										widths: ["auto","auto","auto", "*", "*", "auto", "auto"],
										body: [
										["Nro","Destino", "Nro Boleta", "Beneficiario", "Solicitante", "Importe S/.", "Importe $"],
										...ops,
										["","","","","TOTAL",
											{text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumS1)}`,
												noWrap: true,
												alignment: "right"},
											{text:`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumD1)}`,
												noWrap: true,
												alignment: "right"}]
										]
									},
									layout: {
										hLineWidth: function(i, node) {
										return i === 1 || i === node.table.body.length-1 ? 1 : 0;
										},
										vLineWidth: function(i, node) {
										return 0;
										},
										hLineColor: function(i, node) {
										return i === 0 || i === node.table.body.length-1 ? "black" : "gray";
										},
										// vLineColor: function (i, node) {return (i === 0 || i === node.table.widths.length) ? 'black' : 'gray';},
										// hLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
										// vLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
										paddingLeft: function(i, node) {
										return 4;
										},
										paddingRight: function(i, node) {
										return 0;
										},
										// paddingTop: function(i, node) { return 2; },
										// paddingBottom: function(i, node) { return 2; },
										// fillColor: function (rowIndex, node, columnIndex) { return null; }
										fillColor: function(rowIndex, node, columnIndex) {
										return rowIndex > 0 && rowIndex % 2 === 1 ? "#e6e6e6" : null;
										}
									}
									},
									//------
									{
										text: "Giros Pagados",
										style: "subtitulo"
									},
									{
										style: "tabla",
										table: {
											// headers are automatically repeated if the table spans over multiple pages
											// you can declare how many rows should be treated as headers
											headerRows: 1,
											// ANCHO DE  CADA COLUMNA
											widths: ["auto","auto","auto", "*", "*", "auto", "auto"],
											body: [
											["Nro","Destino", "Nro Boleta", "Beneficiario", "Solicitante", "Importe S/.", "Importe $"],
											...ops2,
											["","","","","TOTAL",
												{text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumS)}`,
													noWrap: true,
													alignment: "right"},
												{text:`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumD)}`,
													noWrap: true,
													alignment: "right"}]
											]
										},
										layout: {
											hLineWidth: function(i, node) {
											return i === 1 || i === node.table.body.length-1 ? 1 : 0;
											},
											vLineWidth: function(i, node) {
											return 0;
											},
											hLineColor: function(i, node) {
											return i === 0 || i === node.table.body.length-1 ? "black" : "gray";
											},
											// vLineColor: function (i, node) {return (i === 0 || i === node.table.widths.length) ? 'black' : 'gray';},
											// hLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
											// vLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
											paddingLeft: function(i, node) {
											return 4;
											},
											paddingRight: function(i, node) {
											return 0;
											},
											// paddingTop: function(i, node) { return 2; },
											// paddingBottom: function(i, node) { return 2; },
											// fillColor: function (rowIndex, node, columnIndex) { return null; }
											fillColor: function(rowIndex, node, columnIndex) {
											return rowIndex > 0 && rowIndex % 2 === 1 ? "#e6e6e6" : null;
											}
										}
									},
									{
										text: "Recibos Internos",
										style: "subtitulo"
									},
									{
										style: "tabla",
										table: {
											// headers are automatically repeated if the table spans over multiple pages
											// you can declare how many rows should be treated as headers
											headerRows: 2,
											// ANCHO DE  CADA COLUMNA
											widths: ["auto","auto","auto","*", "*", "auto", "auto", "auto","auto"],
											body: [
											[	"",						
												"",
												"",
												"",
												"",
												{
												text: "Soles",
												colSpan: 2,
												alignment: "center"
												},
												{},
												{
												text: "Dolares",
												colSpan: 2,
												alignment: "center"
												},
												{}
											],
											["Nro","Documento","Oficina Origen", "Concepto", "Razón Social", "Ingreso", "Egreso", "Ingreso","Egreso"],
											...ops3,
											["","","","","TOTAL",
												{text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumIngS)}`,
													noWrap: true,
													alignment: "right"},
												{text:`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumEgS)}`,
													noWrap: true,
													alignment: "right"},
												{text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumIngD)}`,
													noWrap: true,
													alignment: "right"},
												{text:`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumEgD)}`,
													noWrap: true,
													alignment: "right"},
												]
											]
										},
										layout: {
											hLineWidth: function(i, node) {
											return i === 2 || i === node.table.body.length-1 ? 1 : 0;
											},
											vLineWidth: function(i, node) {
											return 0;
											},
											hLineColor: function(i, node) {
											return i === 0 || i === node.table.body.length-1 ? "black" : "gray";
											},
											// vLineColor: function (i, node) {return (i === 0 || i === node.table.widths.length) ? 'black' : 'gray';},
											// hLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
											// vLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
											paddingLeft: function(i, node) {
											return 4;
											},
											paddingRight: function(i, node) {
											return 0;
											},
											// paddingTop: function(i, node) { return 2; },
											// paddingBottom: function(i, node) { return 2; },
											// fillColor: function (rowIndex, node, columnIndex) { return null; }
											fillColor: function(rowIndex, node, columnIndex) {
											return rowIndex > 2 && rowIndex % 2 === 1 ? "#e6e6e6" : null;
											}
										}
									},
									{
										text: "Servicios",
										style: "subtitulo"
									},
									{
										style: "tabla",
										table: {
											// headers are automatically repeated if the table spans over multiple pages
											// you can declare how many rows should be treated as headers
											headerRows: 2,
											// ANCHO DE  CADA COLUMNA
											widths: ["auto","auto","auto","*", "*", "auto", "auto", "auto","auto"],
											body: [
											[	"",						
												"",
												"",
												"",
												"",
												{
												text: "Soles",
												colSpan: 2,
												alignment: "center"
												},
												{},
												{
												text: "Dolares",
												colSpan: 2,
												alignment: "center"
												},
												{}
											],
											["Nro","Documento","Oficina Origen","Entidad", "Razón Social", "Ingreso", "Egreso", "Ingreso","Egreso"],
											...ops4,
											["","","","","TOTAL",
												{text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(SersumIngS)}`,
													noWrap: true,
													alignment: "right"},
												{text:`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(SersumEgS)}`,
													noWrap: true,
													alignment: "right"},
												{text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(SersumIngD)}`,
													noWrap: true,
													alignment: "right"},
												{text:`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(SersumEgD)}`,
													noWrap: true,
													alignment: "right"},
												]
											]
										},
										layout: {
											hLineWidth: function(i, node) {
											return i === 2 || i === node.table.body.length-1 ? 1 : 0;
											},
											vLineWidth: function(i, node) {
											return 0;
											},
											hLineColor: function(i, node) {
											return i === 0 || i === node.table.body.length-1 ? "black" : "gray";
											},
											// vLineColor: function (i, node) {return (i === 0 || i === node.table.widths.length) ? 'black' : 'gray';},
											// hLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
											// vLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
											paddingLeft: function(i, node) {
											return 4;
											},
											paddingRight: function(i, node) {
											return 0;
											},
											// paddingTop: function(i, node) { return 2; },
											// paddingBottom: function(i, node) { return 2; },
											// fillColor: function (rowIndex, node, columnIndex) { return null; }
											fillColor: function(rowIndex, node, columnIndex) {
											return rowIndex > 2 && rowIndex % 2 === 1 ? "#e6e6e6" : null;
											}
										}
									}
									//------

								],
								styles: {
									header: {
									fontSize: 10,
									margin: [20, 10, 20, 0]
									},
									leyenda: {
									fontSize: 8,
									margin: [10, 10, 0, 0]
									},
									tabla: {
									//margin: [10, 0, 10, 0],
									fontSize: 7
									},
									titulo: {
									fontSize: 18,
									bold: true,
									alignment: "center",
									margin: [0, 10, 0, 4]
									},
									subtitulo: {
									fontSize: 13,
									bold: true,
									alignment: "center",
									margin: [0, 20, 0, 4]
									},
									oficina: {
									fontSize: 10,
									bold: true,
									alignment: "center",
									margin: [0, 0, 0, 10]
									},
									rangoFecha: {
									fontSize: 9,
									bold: false,
									alignment: "center",
									margin: [0, 0, 0, 15]
									},
									saldos: {
									fontSize: 8,
									bold: true,
									alignment: "left",
									margin: [20, 0, 0, 8]
									},
									monto: {
									fontSize: 8,
									bold: false,
									alignment: "right"
									}
								}
								};
								var printer = new PdfPrinter(fonts);
								var now = new Date();
								var pdfDoc = printer.createPdfKitDocument(docDefinition);
								var chunks = [];
								var result;
						
								pdfDoc.on("data", function(chunk) {
								chunks.push(chunk);
								});
								pdfDoc.on("end", function() {
								result = Buffer.concat(chunks);
								res.contentType("application/pdf");
								res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
								res.setHeader("Content-Disposition", `attachment; filename=DetalleCaja_${oficina_codigo1}_${moment().locale("es").format("DD-MM-YYYY_HH'mm")}.pdf`);
								res.send(result);
								});
								pdfDoc.end();
							})
						})
					})

				})				
				
			})
			.catch(err => {
				logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
				res.status(409).send("Error al generar");
				console.log(err)
			});
	})
	})
};

exports.listaDetalleEmpresa = (req, res) => {
	var logger = req.app.get("winston");
	var redis = req.app.get("redis");
	const token = req.header("Authorization").split(" ")[1];
	utils.decodeToken(token, tokenDecodificado => {
		//OBTENER DATOS DEL USUARIO DESDE REDIS
		redis.get(tokenDecodificado.id, async(err, usuario) => {
			usuario = JSON.parse(usuario);
			var empresa_codigo1 = req.body.empresa_codigo;
			var opcion = "*";
			const fechai = req.body.fecha_inicio;
			const fechaf = req.body.fecha_final;
			let empresa_nombre = "";
			let nombre= "";
			const empresa = await models.empresa.findOne({
				where: {
				empresa_codigo: empresa_codigo1
				}
			});
			nombre = empresa.razon_social;
			empresa_nombre = empresa.razon_social.replace(/ /g, "_");
		
			models.sequelize
			.query(`SELECT * from giros_empresa('${empresa_codigo1}','${opcion}', '${fechai}', '${fechaf}')`, {
				type: models.sequelize.QueryTypes.SELECT
			})
			.then(lista => {
				var ops = lista.map(function(item) {
				let arrValores = Object.values(item);
				arrValores[0] = {
					text: arrValores[0],
					noWrap: true,
					alignment: "right"
				  };
				arrValores[1] = {
					text: arrValores[1],
					noWrap: true,
					fillColor:
					arrValores[7] === 2
						? "#c0ffbd"
						: arrValores[7] === 1
						? "#fff9bd"
						: arrValores[7] === 3
						? "#a9a9a9"
						: arrValores[7] === 4
						? "#ffbdbd"
						: null
				};
				arrValores[2] = {
					text: arrValores[2],
					noWrap: true,
					alignment: "left"
				};
				arrValores[3] = {
					text: arrValores[3],
					noWrap: false
				};
				arrValores[4] = {
					text: arrValores[4],
					noWrap: false
				};
				arrValores[5] = {
					text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores[5]),
					noWrap: true,
					alignment: "right"
				};
				arrValores[6] = {
					text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores[6]),
					noWrap: true,
					alignment: "right"
				};
				arrValores.splice(7);
				return arrValores;
				});

				models.sequelize
				.query(`SELECT * from orden_pago_empresa('${empresa_codigo1}','${opcion}', '${fechai}', '${fechaf}')`, {
					type: models.sequelize.QueryTypes.SELECT
				})
				.then(lista2 => {
					var sumS1=0.00;
					var sumD1=0.00;
					var sumS=0.00;
					var sumD=0.00;
					var sumIngS=0.00;
					var sumIngD=0.00;
					var sumEgS=0.00;
					var sumEgD=0.00;
					var SersumIngS=0.00;						
					var SersumIngD=0.00;
					var SersumEgS=0.00;
					var SersumEgD=0.00;
					var ops2 = lista2.map(function(item) {
					let arrValores2 = Object.values(item);
					arrValores2[0] = {
						text: arrValores2[0],
						noWrap: true,
						alignment: "right"
					  };
					arrValores2[1] = {
						text: arrValores2[1],
						noWrap: true,
						fillColor:
						arrValores2[7] === 2
							? "#c0ffbd"
							: arrValores2[7] === 1
							? "#fff9bd"
							: arrValores[7] === 3
							? "#a9a9a9"
							: arrValores2[7] === 4
							? "#ffbdbd"
							: null
					};
					arrValores2[2] = {
						text: arrValores2[2],
						noWrap: true,
						alignment: "right"
					};
					arrValores2[3] = {
						text: arrValores2[3],
						noWrap: false
					};
					arrValores2[4] = {
						text: arrValores2[4],
						noWrap: false
					};
					arrValores2[5] = {
						text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores2[5]),
						noWrap: true,
						alignment: "right"
					};
					arrValores2[6] = {
						text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores2[6]),
						noWrap: true,
						alignment: "right"
					};
					arrValores2.splice(7);
					return arrValores2;
					});
					for(var i=0;i<lista.length;i++){
						sumS1=sumS1+ parseFloat(lista[i].importe_soles);						
						sumD1=sumD1+ parseFloat(lista[i].importe_dolares);
					}

					for(var i=0;i<lista2.length;i++){
						sumS=sumS+ parseFloat(lista2[i].importe_soles);						
						sumD=sumD+ parseFloat(lista2[i].importe_dolares);
					}
					models.sequelize
					.query(`SELECT * from recibos_empresa2('${empresa_codigo1}','${opcion}', '${fechai}', '${fechaf}')`, {
						type: models.sequelize.QueryTypes.SELECT
					})
					.then(lista3 => {
						var ops3 = lista3.map(function(item) {
						let arrValores3 = Object.values(item);
						arrValores3[0] = {
							text: arrValores3[0],
							noWrap: true,
							alignment: "right"
						  };
						arrValores3[1] = {
							text: arrValores3[1]+arrValores3[2],
							noWrap: false
						};
						arrValores3[2] = {
							text: arrValores3[3],
							noWrap: false
						};
						arrValores3[3] = {
							text: arrValores3[4],
							noWrap: false
						};
						arrValores3[4] = {
							text: arrValores3[5],
							noWrap: false
						};
						arrValores3[5] = {
							text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores3[6]),
							noWrap: true,
							alignment: "right"
						};
						arrValores3[6] = {
							text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores3[7]),
							noWrap: true,
							alignment: "right"
						};
						arrValores3[7] = {
							text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores3[8]),
							noWrap: true,
							alignment: "right"
						};
						arrValores3[8] = {
							text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores3[9]),
							noWrap: true,
							alignment: "right"
						};
						arrValores3.splice(9);
						return arrValores3;
						});

						for(var i=0;i<lista3.length;i++){
							sumIngS=sumIngS+ parseFloat(lista3[i].moneda1_ingre);						
							sumIngD=sumIngD+ parseFloat(lista3[i].moneda2_ingre);
							sumEgS=sumEgS+ parseFloat(lista3[i].moneda1_egre);
							sumEgD=sumEgD+ parseFloat(lista3[i].moneda2_egre);
						}

						models.sequelize
						.query(`SELECT * from servicios_empresa('${empresa_codigo1}', '${fechai}', '${fechaf}')`, {
							type: models.sequelize.QueryTypes.SELECT
						})
						.then(lista4 => {
							var ops4 = lista4.map(function(item) {
							let arrValores4 = Object.values(item);
							arrValores4[0] = {
								text: arrValores4[0],
								noWrap: true,
								alignment: "right"
							};
							arrValores4[1] = {
								text: arrValores4[1]+arrValores4[2],
								noWrap: false
							};
							arrValores4[2] = {
								text: arrValores4[3],
								noWrap: false
							};
							arrValores4[3] = {
								text: arrValores4[4],
								noWrap: false
							};
							arrValores4[4] = {
								text: arrValores4[5],
								noWrap: false
							};
							//-----
							arrValores4[5] = {
								text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores4[6]),
								noWrap: true,
								alignment: "right"
							};
							arrValores4[6] = {
								text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores4[7]),
								noWrap: true,
								alignment: "right"
							};
							arrValores4[7] = {
								text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores4[8]),
								noWrap: true,
								alignment: "right"
							};
							arrValores4[8] = {
								text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores4[9]),
								noWrap: true,
								alignment: "right"
							};
							arrValores4.splice(9);
							return arrValores4;
							});

							for(var i=0;i<lista4.length;i++){
								SersumIngS=SersumIngS+ parseFloat(lista4[i].moneda1_ingre);						
								SersumIngD=SersumIngD+ parseFloat(lista4[i].moneda2_ingre);
								SersumEgS=SersumEgS+ parseFloat(lista4[i].moneda1_egre);
								SersumEgD=SersumEgD+ parseFloat(lista4[i].moneda2_egre);
							}

							models.sequelize
							.query(`SELECT * from saldos_empresa2('${fechai}','${fechaf}','${empresa_codigo1}')`, {
								type: models.sequelize.QueryTypes.SELECT
							})
							.then(listasaldos => {	
							var fonts = {
								Helvetica: {
									normal: "Helvetica",
									bold: "Helvetica-Bold",
									italics: "Helvetica-Oblique",
									bolditalics: "Helvetica-BoldOblique"
								}
								};
						
								var docDefinition = {
								defaultStyle: {
									font: "Helvetica"
								},
								header: function(currentPage, pageCount, pageSize) {
									// you can apply any logic and return any valid pdfmake element
									return [
									{
										text: [`Pág. ${currentPage}/${pageCount}`],
										style: "header",
										alignment: currentPage % 2 ? "right" : "left"
									},
									{
										text: [
										moment()
											.locale("es")
											.format("LLLL")
										],
										style: "header",
										alignment: currentPage % 2 ? "right" : "left",
										margin: [20, 0, 20, 0]
									},
									{
										canvas: [
										{
											type: "rect",
											x: 170,
											y: 32,
											w: pageSize.width - 170,
											h: 40
										}
										]
									}
									];
								},
								//pageMArgins:[Left, Top, Right, Bottom]
								pageMargins: [20, 40, 20, 40],
								content: [
									{
									text: "Detalle Caja",
									style: "titulo"
									},								
									{
										text: nombre,
										style: "oficina"
									},
									{
										text: ` Del ${fechai} Al ${fechaf}`,
										style: "rangoFecha"
									},
									{
										columns: [
											{
											// auto-sized columns have their widths based on their content
											width: 120,
											text: 'SALDO ANTERIOR :',
											style: "saldos"
											},
											{
											// star-sized columns fill the remaining space
											// if there's more than one star-column, available width is divided equally
											width: 80,
											text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(listasaldos[0].soles_anterior)}`,
											style: "monto"
											},
											{
											// fixed width
											width: 'auto',
											text: 'SOLES',
											style: "saldos"
											},
											{
											// star-sized columns fill the remaining space
											// if there's more than one star-column, available width is divided equally
											width: 80,
											text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(listasaldos[0].dolares_anterior)}`,
											style: "monto"
											},
											{
											// fixed width
											width: 'auto',
											text: 'DOLARES',
											style: "saldos"
											}
										]
									},
									{
										columns: [
											{
											// auto-sized columns have their widths based on their content
											width: 120,
											text: 'SALDO FINAL :',
											style: "saldos"
											},
											{
											// star-sized columns fill the remaining space
											// if there's more than one star-column, available width is divided equally
											width: 80,
											text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(listasaldos[0].soles_final)}`,
											style: "monto"
											},
											{
											// fixed width
											width: 'auto',
											text: 'SOLES',
											style: "saldos"
											},
											{
											// star-sized columns fill the remaining space
											// if there's more than one star-column, available width is divided equally
											width: 80,
											text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(listasaldos[0].dolares_final)}`,
											style: "monto"
											},
											{
											// fixed width
											width: 'auto',
											text: 'DOLARES',
											style: "saldos"
											}
										]
									},
									{
									style: "leyenda",
									table: {
										// headers are automatically repeated if the table spans over multiple pages
										// you can declare how many rows should be treated as headers
										headerRows: 1,
										// ANCHO DE  CADA COLUMNA
										widths: ["auto", "auto", "auto", "auto", "auto"],
										body: [
										[
											"LEYENDA",
											{
											text: "PENDIENTE",
											color: "#f7e100"
											},
											{
											text: "PAGADO",
											color: "#0cff00"
											},
											{
											text: "REEMBOLSO",
											color: "#a9a9a9"
											},
											{
											text: "ANULADO",
											color: "#ff0000"
											}
										]
										]
									}
									},
									{
										text: "Giros Recaudados",
										style: "subtitulo"
									},
									{
									style: "tabla",
									table: {
										// headers are automatically repeated if the table spans over multiple pages
										// you can declare how many rows should be treated as headers
										headerRows: 1,
										// ANCHO DE  CADA COLUMNA
										widths: ["auto","auto","auto", "*", "*", "auto", "auto"],
										body: [
										["Nro","Destino", "Nro Boleta", "Beneficiario", "Solicitante", "Importe S/.", "Importe $"],
										...ops,
										["","","","","TOTAL",
											{text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumS1)}`,
												noWrap: true,
												alignment: "right"},
											{text:`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumD1)}`,
												noWrap: true,
												alignment: "right"}]
										]
									},
									layout: {
										hLineWidth: function(i, node) {
										return i === 1 || i === node.table.body.length-1 ? 1 : 0;
										},
										vLineWidth: function(i, node) {
										return 0;
										},
										hLineColor: function(i, node) {
										return i === 0 || i === node.table.body.length-1 ? "black" : "gray";
										},
										paddingLeft: function(i, node) {
										return 4;
										},
										paddingRight: function(i, node) {
										return 0;
										},
										fillColor: function(rowIndex, node, columnIndex) {
										return rowIndex > 0 && rowIndex % 2 === 1 ? "#e6e6e6" : null;
										}
									}
									},
									{
										text: "Giros Pagados",
										style: "subtitulo"
									},
									{
										style: "tabla",
										table: {
											// headers are automatically repeated if the table spans over multiple pages
											// you can declare how many rows should be treated as headers
											headerRows: 1,
											// ANCHO DE  CADA COLUMNA
											widths: ["auto","auto","auto", "*", "*", "auto", "auto"],
											body: [
											["Nro","Destino", "Nro Boleta", "Beneficiario", "Solicitante", "Importe S/.", "Importe $"],
											...ops2,
											["","","","","TOTAL",
												{text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumS)}`,
													noWrap: true,
													alignment: "right"},
												{text:`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumD)}`,
													noWrap: true,
													alignment: "right"}]
											]
										},
										layout: {
											hLineWidth: function(i, node) {
											return i === 1 || i === node.table.body.length-1 ? 1 : 0;
											},
											vLineWidth: function(i, node) {
											return 0;
											},
											hLineColor: function(i, node) {
											return i === 0 || i === node.table.body.length-1 ? "black" : "gray";
											},
											paddingLeft: function(i, node) {
											return 4;
											},
											paddingRight: function(i, node) {
											return 0;
											},
											fillColor: function(rowIndex, node, columnIndex) {
											return rowIndex > 0 && rowIndex % 2 === 1 ? "#e6e6e6" : null;
											}
										}
									},
									{
										text: "Recibos Internos",
										style: "subtitulo"
									},
									{
										style: "tabla",
										table: {
											// headers are automatically repeated if the table spans over multiple pages
											// you can declare how many rows should be treated as headers
											headerRows: 2,
											// ANCHO DE  CADA COLUMNA
											widths: ["auto","auto","auto","*", "*", "auto", "auto", "auto","auto"],
											body: [
											[	"",					
												"",
												"",
												"",
												"",
												{
												text: "Soles",
												colSpan: 2,
												alignment: "center"
												},
												{},
												{
												text: "Dolares",
												colSpan: 2,
												alignment: "center"
												},
												{}
											],
											["Nro","Documento","Oficina Origen", "Concepto", "Razón Social", "Ingreso", "Egreso", "Ingreso","Egreso"],
											...ops3,
											["","","","","TOTAL",
												{text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumIngS)}`,
													noWrap: true,
													alignment: "right"},
												{text:`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumEgS)}`,
													noWrap: true,
													alignment: "right"},
												{text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumIngD)}`,
													noWrap: true,
													alignment: "right"},
												{text:`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumEgD)}`,
													noWrap: true,
													alignment: "right"},
												]
											]
										},
										layout: {
											hLineWidth: function(i, node) {
											return i === 2 || i === node.table.body.length-1 ? 1 : 0;
											},
											vLineWidth: function(i, node) {
											return 0;
											},
											hLineColor: function(i, node) {
											return i === 0 || i === node.table.body.length-1 ? "black" : "gray";
											},
											paddingLeft: function(i, node) {
											return 4;
											},
											paddingRight: function(i, node) {
											return 0;
											},
											fillColor: function(rowIndex, node, columnIndex) {
											return rowIndex > 2 && rowIndex % 2 === 1 ? "#e6e6e6" : null;
											}
										}
									},
									{
										text: "Servicios",
										style: "subtitulo"
									},
									{
										style: "tabla",
										table: {
											// headers are automatically repeated if the table spans over multiple pages
											// you can declare how many rows should be treated as headers
											headerRows: 2,
											// ANCHO DE  CADA COLUMNA
											widths: ["auto","auto","auto","*", "*", "auto", "auto", "auto","auto"],
											body: [
											[	"",						
												"",
												"",
												"",
												"",
												{
												text: "Soles",
												colSpan: 2,
												alignment: "center"
												},
												{},
												{
												text: "Dolares",
												colSpan: 2,
												alignment: "center"
												},
												{}
											],
											["Nro","Documento","Oficina Origen","Entidad", "Razón Social", "Ingreso", "Egreso", "Ingreso","Egreso"],
											...ops4,
											["","","","","TOTAL",
												{text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(SersumIngS)}`,
													noWrap: true,
													alignment: "right"},
												{text:`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(SersumEgS)}`,
													noWrap: true,
													alignment: "right"},
												{text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(SersumIngD)}`,
													noWrap: true,
													alignment: "right"},
												{text:`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(SersumEgD)}`,
													noWrap: true,
													alignment: "right"},
												]
											]
										},
										layout: {
											hLineWidth: function(i, node) {
											return i === 2 || i === node.table.body.length-1 ? 1 : 0;
											},
											vLineWidth: function(i, node) {
											return 0;
											},
											hLineColor: function(i, node) {
											return i === 0 || i === node.table.body.length-1 ? "black" : "gray";
											},
											// vLineColor: function (i, node) {return (i === 0 || i === node.table.widths.length) ? 'black' : 'gray';},
											// hLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
											// vLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
											paddingLeft: function(i, node) {
											return 4;
											},
											paddingRight: function(i, node) {
											return 0;
											},
											// paddingTop: function(i, node) { return 2; },
											// paddingBottom: function(i, node) { return 2; },
											// fillColor: function (rowIndex, node, columnIndex) { return null; }
											fillColor: function(rowIndex, node, columnIndex) {
											return rowIndex > 2 && rowIndex % 2 === 1 ? "#e6e6e6" : null;
											}
										}
									}
								],
								styles: {
									header: {
									fontSize: 10,
									margin: [20, 10, 20, 0]
									},
									leyenda: {
									fontSize: 8,
									margin: [10, 10, 0, 0]
									},
									tabla: {
									//margin: [10, 0, 10, 0],
									fontSize: 7
									},
									titulo: {
									fontSize: 18,
									bold: true,
									alignment: "center",
									margin: [0, 10, 0, 4]
									},
									subtitulo: {
									fontSize: 13,
									bold: true,
									alignment: "center",
									margin: [0, 20, 0, 4]
									},
									oficina: {
									fontSize: 10,
									bold: true,
									alignment: "center",
									margin: [0, 0, 0, 10]
									},
									rangoFecha: {
									fontSize: 9,
									bold: false,
									alignment: "center",
									margin: [0, 0, 0, 15]
									},
									saldos: {
									fontSize: 8,
									bold: true,
									alignment: "left",
									margin: [20, 0, 0, 8]
									},
									monto: {
									fontSize: 8,
									bold: false,
									alignment: "right"
									}
								}
								};
								var printer = new PdfPrinter(fonts);
								var now = new Date();
								var pdfDoc = printer.createPdfKitDocument(docDefinition);
								var chunks = [];
								var result;
						
								pdfDoc.on("data", function(chunk) {
								chunks.push(chunk);
								});
								pdfDoc.on("end", function() {
								result = Buffer.concat(chunks);
								res.contentType("application/pdf");
								res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
								res.setHeader("Content-Disposition", `attachment; filename=DetalleCaja_${empresa_codigo1}_${moment().locale("es").format("DD-MM-YYYY_HH'mm")}.pdf`);
								res.send(result);
								});
								pdfDoc.end();
							})
						})
					})

				})				
				
			})
			.catch(err => {
				logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
				res.status(409).send("Error al generar");
				console.log(err)
			});
		})
	})
};

//--EXCEL
exports.excel_caja = async (req, res) => {
	var logger = req.app.get("winston");
	const token = req.header("Authorization").split(" ")[1];
  
	const cajaCodigo = req.body.caja;
	const fechai = req.body.fechai;
	const fechaf = req.body.fechaf;
  
	const caja = await models.caja.findOne({
	  where: {
		caja_codigo: cajaCodigo
	  }
	});

	const caja_nombre = caja.caja_nombre;
  
	//LISTAR GIROS DESDE OFICINA XXXXXXX
	models.sequelize
	  .query(
		`SELECT * from giros('${cajaCodigo}','', '${fechai}', '${fechaf}')`,
		{
		  type: models.sequelize.QueryTypes.SELECT
		}
	  )
	  .then(lista => {
		let listaRecaudados = [];
		lista.forEach(fila => {
			listaRecaudados.push({
			...fila,
			fecha_hora_operacion: moment(fila.fecha_hora_operacion)
			  .locale("es")
			  .format("DD/MM/Y HH:mm:ss"),
			st_estado: fila.st_estado === 1 ? "PENDIENTE" : fila.st_estado === 2 ? "PAGADO" 
				: fila.st_estado === 3 ? "REEMBOLSO" : "ANULADO",
			importe_soles: parseFloat(fila.importe_soles),
			importe_dolares: parseFloat(fila.importe_dolares)
		  });
		});
  
		//LISTAR GIROS PARA OFICINA XXXXXXX
		models.sequelize
		  .query(
			`SELECT * from orden_pago('${cajaCodigo}','', '${fechai}', '${fechaf}')`,
			{
			  type: models.sequelize.QueryTypes.SELECT
			}
		  )
		  .then(listaOPs => {
			let listaOrdenesPago = [];
			listaOPs.forEach(op => {
			  listaOrdenesPago.push({
				...op,
				fecha_hora_operacion: moment(op.fecha_hora_operacion)
					.locale("es")
					.format("DD/MM/Y HH:mm:ss"),
				st_estado: op.st_estado === 1 ? "PENDIENTE" : op.st_estado === 2 ? "PAGADO" 
					: op.st_estado === 3 ? "REEMBOLSO" : "ANULADO",
				importe_soles: parseFloat(op.importe_soles),
				importe_dolares: parseFloat(op.importe_dolares)
			  });
			});
  
			models.sequelize
			  .query(
				`SELECT * from recibos2('${cajaCodigo}','', '${fechai}', '${fechaf}')`,
				{
				  type: models.sequelize.QueryTypes.SELECT
				}
			  )
			  .then(lista => {
				let listaRecibos = [];
				lista.forEach(re => {
					listaRecibos.push({
					...re,
					nro_Solicitud: re.documento_codigo + re.nro_operacion,
					fecha_hora_operacion: moment(re.fecha_hora_operacion)
					  .locale("es")
					  .format("DD/MM/Y HH:mm:ss"),
					moneda1_ingre: parseFloat(re.moneda1_ingre),
					moneda1_egre: parseFloat(re.moneda1_egre),
					moneda2_ingre: parseFloat(re.moneda2_ingre),
					moneda2_egre: parseFloat(re.moneda2_egre)
				  });
				});
  
				models.sequelize
				  .query(
					`SELECT * from servicios_caja('${cajaCodigo}', '${fechai}', '${fechaf}')`,
					{
					  type: models.sequelize.QueryTypes.SELECT
					}
				  )
				  .then(lista => {
					let listaServicios = [];
					lista.forEach(op => {
						listaServicios.push({
						...se,
						nro_Solicitud: se.documento_codigo + se.nro_operacion,
						fecha_hora_operacion: moment(se.fecha_hora_operacion)
							.locale("es")
							.format("DD/MM/Y HH:mm:ss"),
						moneda1_ingre: parseFloat(se.moneda1_ingre),
						moneda1_egre: parseFloat(se.moneda1_egre),
						moneda2_ingre: parseFloat(se.moneda2_ingre),
						moneda2_egre: parseFloat(se.moneda2_egre)
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
					let hoja_transferencias = workbook.addWorksheet("Giros");
					let hoja_orden_pago = workbook.addWorksheet("Giros Pagados");
					let hoja_recibos = workbook.addWorksheet("Recibos Internos");
					let hoja_servicios = workbook.addWorksheet("Servicios");
					let fecha_in = moment(fechai)
					  .locale("es")
					  .format("DD/MMMM/YYYY");
					let fecha_fin = moment(fechaf)
					  .locale("es")
					  .format("DD/MMMM/YYYY");
					
					construirHojaTransferencias(caja_nombre, listaRecaudados, hoja_transferencias);
					construirHojaOrdenpago(caja_nombre, listaOrdenesPago, hoja_orden_pago);
					construirHojaRecibos(caja_nombre, listaRecibos, hoja_recibos);
					construirHojaServicios(caja_nombre, listaServicios, hoja_servicios);
  
					//CONSTRUIR EXCEL
					res.status(200);
					res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
					res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
					res.setHeader("Content-Disposition", `attachment; filename=${caja_nombre}.xlsx`);
					workbook.xlsx.write(res).then(function() {
					  res.end();
					});
				  })
				  .catch(err => {
					logger.log("error", { ubicacion: filename, token: token, message: err.message });
					res.status(409).send("Error al generar");
					console.log(err)
				  });
			  })
			  .catch(err => {
				logger.log("error", { ubicacion: filename, token: token, message: err.message });
				res.status(409).send("Error al generar");
				console.log(err)
			  });
		  })
		  .catch(err => {
			logger.log("error", { ubicacion: filename, token: token, message: err.message });
			res.status(409).send("Error al generar");
			console.log(err)
		  });
	  })
	  .catch(err => {
		logger.log("error", { ubicacion: filename, token: token, message: err.message });
		res.status(409).send("Error al generar");
		console.log(err)
	  });
  };

exports.excel_of = async (req, res) => {
	var logger = req.app.get("winston");
	const token = req.header("Authorization").split(" ")[1];
  
	const oficinaCodigo = req.body.oficina;
	const fechai = req.body.fechai;
	const fechaf = req.body.fechaf;
  
	const oficina = await models.oficina.findOne({
	  where: {
		oficina_codigo: oficinaCodigo
	  }
	});

	const oficina_nombre = oficina.oficina_nombre;
  
	//LISTAR GIROS DESDE OFICINA XXXXXXX
	models.sequelize
	  .query(
		`SELECT * from giros_oficina('${oficinaCodigo}','', '${fechai}', '${fechaf}')`,
		{
		  type: models.sequelize.QueryTypes.SELECT
		}
	  )
	  .then(lista => {
		let listaRecaudados = [];
		lista.forEach(fila => {
			listaRecaudados.push({
			...fila,
			fecha_hora_operacion: moment(fila.fecha_hora_operacion)
			  .locale("es")
			  .format("DD/MM/Y HH:mm:ss"),
			st_estado: fila.st_estado === 1 ? "PENDIENTE" : fila.st_estado === 2 ? "PAGADO" 
				: fila.st_estado === 3 ? "REEMBOLSO" : "ANULADO",
			importe_soles: parseFloat(fila.importe_soles),
			importe_dolares: parseFloat(fila.importe_dolares)
		  });
		});
  
		//LISTAR GIROS PARA OFICINA XXXXXXX
		models.sequelize
		  .query(
			`SELECT * from orden_pago_oficina('${oficinaCodigo}','', '${fechai}', '${fechaf}')`,
			{
			  type: models.sequelize.QueryTypes.SELECT
			}
		  )
		  .then(listaOPs => {
			let listaOrdenesPago = [];
			listaOPs.forEach(op => {
			  listaOrdenesPago.push({
				...op,
				fecha_hora_operacion: moment(op.fecha_hora_operacion)
					.locale("es")
					.format("DD/MM/Y HH:mm:ss"),
				st_estado: op.st_estado === 1 ? "PENDIENTE" : op.st_estado === 2 ? "PAGADO" 
					: op.st_estado === 3 ? "REEMBOLSO" : "ANULADO",
				importe_soles: parseFloat(op.importe_soles),
				importe_dolares: parseFloat(op.importe_dolares)
			  });
			});
  
			models.sequelize
			  .query(
				`SELECT * from recibos_oficina2('${oficinaCodigo}','', '${fechai}', '${fechaf}')`,
				{
				  type: models.sequelize.QueryTypes.SELECT
				}
			  )
			  .then(lista => {
				let listaRecibos = [];
				lista.forEach(re => {
					listaRecibos.push({
					...re,
					nro_Solicitud: re.documento_codigo + re.nro_operacion,
					fecha_hora_operacion: moment(re.fecha_hora_operacion)
					  .locale("es")
					  .format("DD/MM/Y HH:mm:ss"),
					moneda1_ingre: parseFloat(re.moneda1_ingre),
					moneda1_egre: parseFloat(re.moneda1_egre),
					moneda2_ingre: parseFloat(re.moneda2_ingre),
					moneda2_egre: parseFloat(re.moneda2_egre)
				  });
				});
  
				models.sequelize
				  .query(
					`SELECT * from servicios_oficina('${oficinaCodigo}', '${fechai}', '${fechaf}')`,
					{
					  type: models.sequelize.QueryTypes.SELECT
					}
				  )
				  .then(lista => {
					let listaServicios = [];
					lista.forEach(op => {
						listaServicios.push({
						...se,
						nro_Solicitud: se.documento_codigo + se.nro_operacion,
						fecha_hora_operacion: moment(se.fecha_hora_operacion)
							.locale("es")
							.format("DD/MM/Y HH:mm:ss"),
						moneda1_ingre: parseFloat(se.moneda1_ingre),
						moneda1_egre: parseFloat(se.moneda1_egre),
						moneda2_ingre: parseFloat(se.moneda2_ingre),
						moneda2_egre: parseFloat(se.moneda2_egre)
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
					let hoja_transferencias = workbook.addWorksheet("Giros");
					let hoja_orden_pago = workbook.addWorksheet("Giros Pagados");
					let hoja_recibos = workbook.addWorksheet("Recibos Internos");
					let hoja_servicios = workbook.addWorksheet("Servicios");
					let fecha_in = moment(fechai)
					  .locale("es")
					  .format("DD/MMMM/YYYY");
					let fecha_fin = moment(fechaf)
					  .locale("es")
					  .format("DD/MMMM/YYYY");
					
					construirHojaTransferencias(oficina_nombre, listaRecaudados, hoja_transferencias);
					construirHojaOrdenpago(oficina_nombre, listaOrdenesPago, hoja_orden_pago);
					construirHojaRecibos(oficina_nombre, listaRecibos, hoja_recibos);
					construirHojaServicios(oficina_nombre, listaServicios, hoja_servicios);
  
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
					console.log(err)
				  });
			  })
			  .catch(err => {
				logger.log("error", { ubicacion: filename, token: token, message: err.message });
				res.status(409).send("Error al generar");
				console.log(err)
			  });
		  })
		  .catch(err => {
			logger.log("error", { ubicacion: filename, token: token, message: err.message });
			res.status(409).send("Error al generar");
			console.log(err)
		  });
	  })
	  .catch(err => {
		logger.log("error", { ubicacion: filename, token: token, message: err.message });
		res.status(409).send("Error al generar");
		console.log(err)
	  });
  };

exports.excel_emp = async (req, res) => {
	var logger = req.app.get("winston");
	const token = req.header("Authorization").split(" ")[1];
  
	const empresaCodigo = req.body.empresa;
	const fechai = req.body.fechai;
	const fechaf = req.body.fechaf;
  
	const empresa = await models.empresa.findOne({
	  where: {
		empresa_codigo: empresaCodigo
	  }
	});

	const empresa_nombre = empresa.razon_social;
  
	//LISTAR GIROS DESDE OFICINA XXXXXXX
	models.sequelize
	  .query(
		`SELECT * from giros_empresa('${empresaCodigo}','', '${fechai}', '${fechaf}')`,
		{
		  type: models.sequelize.QueryTypes.SELECT
		}
	  )
	  .then(lista => {
		let listaRecaudados = [];
		lista.forEach(fila => {
			listaRecaudados.push({
			...fila,
			fecha_hora_operacion: moment(fila.fecha_hora_operacion)
			  .locale("es")
			  .format("DD/MM/Y HH:mm:ss"),
			st_estado: fila.st_estado === 1 ? "PENDIENTE" : fila.st_estado === 2 ? "PAGADO" 
				: fila.st_estado === 3 ? "REEMBOLSO" : "ANULADO",
			importe_soles: parseFloat(fila.importe_soles),
			importe_dolares: parseFloat(fila.importe_dolares)
		  });
		});
  
		//LISTAR GIROS PARA OFICINA XXXXXXX
		models.sequelize
		  .query(
			`SELECT * from orden_pago_empresa('${empresaCodigo}','', '${fechai}', '${fechaf}')`,
			{
			  type: models.sequelize.QueryTypes.SELECT
			}
		  )
		  .then(listaOPs => {
			let listaOrdenesPago = [];
			listaOPs.forEach(op => {
			  listaOrdenesPago.push({
				...op,
				fecha_hora_operacion: moment(op.fecha_hora_operacion)
					.locale("es")
					.format("DD/MM/Y HH:mm:ss"),
				st_estado: op.st_estado === 1 ? "PENDIENTE" : op.st_estado === 2 ? "PAGADO" 
					: op.st_estado === 3 ? "REEMBOLSO" : "ANULADO",
				importe_soles: parseFloat(op.importe_soles),
				importe_dolares: parseFloat(op.importe_dolares)
			  });
			});
  
			models.sequelize
			  .query(
				`SELECT * from recibos_empresa2('${empresaCodigo}','', '${fechai}', '${fechaf}')`,
				{
				  type: models.sequelize.QueryTypes.SELECT
				}
			  )
			  .then(lista => {
				let listaRecibos = [];
				lista.forEach(re => {
					listaRecibos.push({
					...re,
					nro_Solicitud: re.documento_codigo + re.nro_operacion,
					fecha_hora_operacion: moment(re.fecha_hora_operacion)
					  .locale("es")
					  .format("DD/MM/Y HH:mm:ss"),
					moneda1_ingre: parseFloat(re.moneda1_ingre),
					moneda1_egre: parseFloat(re.moneda1_egre),
					moneda2_ingre: parseFloat(re.moneda2_ingre),
					moneda2_egre: parseFloat(re.moneda2_egre)
				  });
				});
  
				models.sequelize
				  .query(
					`SELECT * from servicios_empresa('${empresaCodigo}', '${fechai}', '${fechaf}')`,
					{
					  type: models.sequelize.QueryTypes.SELECT
					}
				  )
				  .then(lista => {
					let listaServicios = [];
					lista.forEach(op => {
						listaServicios.push({
						...se,
						nro_Solicitud: se.documento_codigo + se.nro_operacion,
						fecha_hora_operacion: moment(se.fecha_hora_operacion)
							.locale("es")
							.format("DD/MM/Y HH:mm:ss"),
						moneda1_ingre: parseFloat(se.moneda1_ingre),
						moneda1_egre: parseFloat(se.moneda1_egre),
						moneda2_ingre: parseFloat(se.moneda2_ingre),
						moneda2_egre: parseFloat(se.moneda2_egre)
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
					let hoja_transferencias = workbook.addWorksheet("Giros");
					let hoja_orden_pago = workbook.addWorksheet("Giros Pagados");
					let hoja_recibos = workbook.addWorksheet("Recibos Internos");
					let hoja_servicios = workbook.addWorksheet("Servicios");
					let fecha_in = moment(fechai)
					  .locale("es")
					  .format("DD/MMMM/YYYY");
					let fecha_fin = moment(fechaf)
					  .locale("es")
					  .format("DD/MMMM/YYYY");
					
					construirHojaTransferencias(empresa_nombre, listaRecaudados, hoja_transferencias);
					construirHojaOrdenpago(empresa_nombre, listaOrdenesPago, hoja_orden_pago);
					construirHojaRecibos(empresa_nombre, listaRecibos, hoja_recibos);
					construirHojaServicios(empresa_nombre, listaServicios, hoja_servicios);
  
					//CONSTRUIR EXCEL
					res.status(200);
					res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
					res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
					res.setHeader("Content-Disposition", `attachment; filename=${empresa_nombre}.xlsx`);
					workbook.xlsx.write(res).then(function() {
					  res.end();
					});
				  })
				  .catch(err => {
					logger.log("error", { ubicacion: filename, token: token, message: err.message });
					res.status(409).send("Error al generar");
					console.log(err)
				  });
			  })
			  .catch(err => {
				logger.log("error", { ubicacion: filename, token: token, message: err.message });
				res.status(409).send("Error al generar");
				console.log(err)
			  });
		  })
		  .catch(err => {
			logger.log("error", { ubicacion: filename, token: token, message: err.message });
			res.status(409).send("Error al generar");
			console.log(err)
		  });
	  })
	  .catch(err => {
		logger.log("error", { ubicacion: filename, token: token, message: err.message });
		res.status(409).send("Error al generar");
		console.log(err)
	  });
  };
  
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
  
	hoja_transferencias.mergeCells("A1", "I1");
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
  
	hoja_transferencias.mergeCells("A2", "I2");
	hoja_transferencias.getCell("A2").value = "Giros Recaudados";
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
  
	hoja_transferencias.mergeCells("A3", "C3");
	hoja_transferencias.getCell("A3").value = "Sub Totales";
	hoja_transferencias.getRow(3).height = 30;
  
	//ENCABEZADOS
  
	hoja_transferencias.getRow(4).values = [
	  "Nro",
	  "Destino",
	  "Nro Boleta",
	  "Fecha y hora de solicitud",
	  "Beneficiario",
	  "Solicitante",
	  "Importe Soles",    
	  "Importe Dólares",
	  "Estado"
	];
  
	["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4"].map(key => {
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
		key: "nro",
		width: 5
	  },
	  {
		key: "oficina_nombre",
		width: 27
	  },
	  {
		key: "nro_Solicitud",
		width: 13
	  },
	  {
		key: "fecha_hora_operacion",
		width: 20
	  },
	  {
		key: "beneficiario_razon_social",
		width: 37
	  },
	  {
		key: "solicitante_razon_social",
		width: 37
	  },
	  {
		key: "importe_soles",
		width: 15
	  },
	  {
		key: "importe_dolares",
		width: 10
	  },
	  {
		key: "st_estado",
		width: 15
	  }
	];
  
	//ESTILOS FILAS 3 Y 4
	["A3", "B3", "C3", "D3", "E3", "F3", "G3", "H3", "I3"].map(key => {
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
  
	["F3", "G3", "H3", "I3"].map(key => {
	  hoja_transferencias.getCell(key).font = {
		name: "Calibri",
		size: 11,
		bold: false,
		color: {
		  argb: "FFFFFFFF"
		}
	  };
	});
  
	["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4"].map(key => {
	  hoja_transferencias.getCell(key).fill = {
		type: "pattern",
		pattern: "solid",
		fgColor: {
		  argb: "FFA9D08C"
		}
	  };
	});
	["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4"].map(key => {
	  hoja_transferencias.getCell(key).font = {
		name: "Calibri",
		size: 11,
		bold: true,
		color: {
		  argb: "FF000000"
		}
	  };
	});
	["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4"].map(key => {
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
	hoja_transferencias.getColumn(4).numFmt = "dd/mm/yyyy h:mm";
	hoja_transferencias.getColumn(7).numFmt = '_-"S/."* #,##0.00_-;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';
	hoja_transferencias.getColumn(8).numFmt = '_-"$."* #,##0.00_-;-"$."* #,##0.00_-;_-"$."* "-"??_-;_-@_-';
	  
	//AGREGAR FILAS
	hoja_transferencias.addRows(listaTransferencias);
	//FORMULAS
	hoja_transferencias.getCell("G3").value = {
	  formula: "SUM(G5:G10000)"
	};
	hoja_transferencias.getCell("H3").value = {
	  formula: "SUM(H5:H10000)"
	};
	//FILTROS
	hoja_transferencias.autoFilter = {
	  from: {
		row: 4,
		column: 1
	  },
	  to: {
		row: 10000,
		column: 9
	  }
	};

	return hoja_transferencias;
  }
  
  function construirHojaOrdenpago(oficina_nombre, listaOrdenesPago, hoja_orden_pago) {
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
  
	hoja_orden_pago.mergeCells("A1", "I1");
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
  
	hoja_orden_pago.mergeCells("A2", "I2");
	hoja_orden_pago.getCell("A2").value = "Giros Pagados";
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
  
	hoja_orden_pago.mergeCells("A3", "C3");
	hoja_orden_pago.getCell("A3").value = "Sub Totales";
	hoja_orden_pago.getRow(3).height = 30;
  
	//ENCABEZADOS
  
	hoja_orden_pago.getRow(4).values = [
		"Nro",
		"Origen",
		"Nro Boleta",
		"Fecha y hora de solicitud",
		"Beneficiario",
		"Solicitante",
		"Importe Soles",    
		"Importe Dólares",
		"Estado"
	];
  
	["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4"].map(key => {
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
			key: "nro",
			width: 5
		},
		{
			key: "oficina_nombre",
			width: 27
		},
		{
			key: "nro_Solicitud",
			width: 13
		},
		{
			key: "fecha_hora_operacion",
			width: 20
		},
		{
			key: "beneficiario_razon_social",
			width: 37
		},
		{
			key: "solicitante_razon_social",
			width: 37
		},
		{
			key: "importe_soles",
			width: 15
		},
		{
			key: "importe_dolares",
			width: 10
		},
		{
			key: "st_estado",
			width: 15
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
  
	["F3", "G3", "H3", "I3"].map(key => {
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
	["A3", "B3", "C3", "D3", "E3", "F3", "G3", "H3", "I3"].map(key => {
	  hoja_orden_pago.getCell(key).fill = {
		type: "pattern",
		pattern: "solid",
		fgColor: {
		  argb: "FF305496"
		}
	  };
	});
  
	["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4"].map(key => {
	  hoja_orden_pago.getCell(key).fill = {
		type: "pattern",
		pattern: "solid",
		fgColor: {
		  argb: "FF96C2E6"
		}
	  };
	});
  
	["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4"].map(key => {
	  hoja_orden_pago.getCell(key).font = {
		name: "Calibri",
		size: 11,
		bold: true,
		color: {
		  argb: "FF000000"
		}
	  };
	});
  
	["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4"].map(key => {
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
	hoja_orden_pago.getColumn(4).numFmt = "dd/mm/yyyy h:mm";
	hoja_orden_pago.getColumn(7).numFmt = '_-"S/."* #,##0.00_-;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';
	hoja_orden_pago.getColumn(8).numFmt = '_-"$."* #,##0.00_-;-"$."* #,##0.00_-;_-"$."* "-"??_-;_-@_-';
  
	//AGREGAR FILAS
	hoja_orden_pago.addRows(listaOrdenesPago);
	//FORMULAS
	hoja_orden_pago.getCell("G3").value = {
	  formula: "SUM(G5:G10000)"
	};
	hoja_orden_pago.getCell("H3").value = {
	  formula: "SUM(H5:H10000)"
	};
	//FILTROS
	hoja_orden_pago.autoFilter = {
	  from: {
		row: 4,
		column: 1
	  },
	  to: {
		row: 10000,
		column: 9
	  }
	};

	return hoja_orden_pago;
  }
  
  function construirHojaRecibos(oficina_nombre, listaRecibos, hoja_recibos) {
	hoja_recibos.getCell("A1").alignment = {
	  horizontal: "center",
	  vertical: "middle",
	  wrapText: true
	};
	hoja_recibos.getCell("A2").alignment = {
	  horizontal: "center",
	  vertical: "middle",
	  wrapText: true
	};
	hoja_recibos.getCell("A3").alignment = {
	  horizontal: "center",
	  wrapText: true
	};
	//COMBINAR CELDAS
  
	hoja_recibos.mergeCells("A1", "J1");
	hoja_recibos.getCell("A1").value = oficina_nombre;
	hoja_recibos.getRow(1).height = 50;
	hoja_recibos.getCell("A1").fill = {
	  type: "pattern",
	  pattern: "solid",
	  fgColor: {
		argb: "FF305496"
	  }
	};
	hoja_recibos.getCell("A1").font = {
	  name: "Calibri",
	  size: 18,
	  bold: true,
	  color: {
		argb: "FFFFFFFF"
	  }
	};
  
	hoja_recibos.mergeCells("A2", "J2");
	hoja_recibos.getCell("A2").value = "Recibos Internos";
	hoja_recibos.getRow(2).height = 30;
	hoja_recibos.getCell("A2").fill = {
	  type: "pattern",
	  pattern: "solid",
	  fgColor: {
		argb: "FF305496"
	  }
	};
	hoja_recibos.getCell("A2").font = {
	  name: "Calibri",
	  size: 12,
	  bold: true,
	  color: {
		argb: "FFFFFFFF"
	  }
	};
  
	hoja_recibos.mergeCells("A3", "D3");
	hoja_recibos.getCell("A3").value = "Sub Totales";
	hoja_recibos.getRow(3).height = 30;
  
	//ENCABEZADOS
  
	hoja_recibos.getRow(4).values = [
		"Nro",
		"Origen",
		"Nro Boleta",
		"Fecha y hora de solicitud",
		"Concepto",
		"Razón Social",
		"Ingreso Soles", 
		"Egreso Soles", 
		"Ingreso Dólares",
		"Egreso Dólares"
	];
  
	["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4", "J4"].map(key => {
	hoja_recibos.getCell(key).alignment = {
		horizontal: "center",
		vertical: "middle",
		wrapText: true
	  };
	});
  
	hoja_recibos.getRow(4).height = 50;
  
	//IDENTIFICADORES COLUMNAS
	hoja_recibos.columns = [
		{
			key: "nro",
			width: 5
		},
		{
			key: "oficina_nombre",
			width: 27
		},
		{
			key: "nro_Solicitud",
			width: 13
		},
		{
			key: "fecha_hora_operacion",
			width: 20
		},
		{
			key: "concepto",
			width: 37
		},
		{
			key: "cliente_razon_social",
			width: 37
		},
		{
			key: "moneda1_ingre",
			width: 17
		},
		{
			key: "moneda1_egre",
			width: 12
		},
		{
			key: "moneda2_ingre",
			width: 10
		},
		{
			key: "moneda2_egre",
			width: 10
		}
	];
  
	hoja_recibos.getCell("A3").font = {
	  name: "Calibri",
	  size: 12,
	  bold: true,
	  color: {
		argb: "FFFFFFFF"
	  }
	};
  
	["F3", "G3", "H3", "I3", "J3"].map(key => {
	hoja_recibos.getCell(key).font = {
		name: "Calibri",
		size: 11,
		bold: false,
		color: {
		  argb: "FFFFFFFF"
		}
	  };
	});
	//ESTILOS FILAS 3 Y 4
	["A3", "B3", "C3", "D3", "E3", "F3", "G3", "H3", "I3", "J3"].map(key => {
		hoja_recibos.getCell(key).fill = {
		type: "pattern",
		pattern: "solid",
		fgColor: {
		  argb: "FF305496"
		}
	  };
	});
  
	["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4", "J4"].map(key => {
		hoja_recibos.getCell(key).fill = {
		type: "pattern",
		pattern: "solid",
		fgColor: {
		  argb: "FF96C2E6"
		}
	  };
	});
  
	["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4", "J4"].map(key => {
		hoja_recibos.getCell(key).font = {
		name: "Calibri",
		size: 11,
		bold: true,
		color: {
		  argb: "FF000000"
		}
	  };
	});
	["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4", "J4"].map(key => {
		hoja_recibos.getCell(key).border = {
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
	hoja_recibos.getColumn(4).numFmt = "dd/mm/yyyy h:mm";
	hoja_recibos.getColumn(7).numFmt = '_-"S/."* #,##0.00_-;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';
	hoja_recibos.getColumn(8).numFmt = '_-"S/."* #,##0.00_-;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';
	hoja_recibos.getColumn(9).numFmt = '_-"$."* #,##0.00_-;-"$."* #,##0.00_-;_-"$."* "-"??_-;_-@_-';
	hoja_recibos.getColumn(10).numFmt = '_-"$."* #,##0.00_-;-"$."* #,##0.00_-;_-"$."* "-"??_-;_-@_-';
  
	//AGREGAR FILAS
	hoja_recibos.addRows(listaRecibos);
	//FORMULAS
	hoja_recibos.getCell("G3").value = {
	  formula: "SUM(G5:G10000)"
	};
	hoja_recibos.getCell("H3").value = {
	  formula: "SUM(H5:H10000)"
	};
	hoja_recibos.getCell("I3").value = {
	  formula: "SUM(I5:I10000)"
	};
	hoja_recibos.getCell("J3").value = {
	  formula: "SUM(J5:J10000)"
	};
	//FILTROS
	hoja_recibos.autoFilter = {
	  from: {
		row: 4,
		column: 1
	  },
	  to: {
		row: 10000,
		column: 10
	  }
	};

	return hoja_recibos;
  }
  
  function construirHojaServicios(oficina_nombre, listaServicios, hoja_servicios) {
	hoja_servicios.getCell("A1").alignment = {
	  horizontal: "center",
	  vertical: "middle",
	  wrapText: true
	};
	hoja_servicios.getCell("A2").alignment = {
	  horizontal: "center",
	  vertical: "middle",
	  wrapText: true
	};
	hoja_servicios.getCell("A3").alignment = {
	  horizontal: "center",
	  wrapText: true
	};
	//COMBINAR CELDAS
  
	hoja_servicios.mergeCells("A1", "J1");
	hoja_servicios.getCell("A1").value = oficina_nombre;
	hoja_servicios.getRow(1).height = 50;
	hoja_servicios.getCell("A1").fill = {
	  type: "pattern",
	  pattern: "solid",
	  fgColor: {
		argb: "FF963030"
	  }
	};
	hoja_servicios.getCell("A1").font = {
	  name: "Calibri",
	  size: 18,
	  bold: true,
	  color: {
		argb: "FFFFFFFF"
	  }
	};
  
	hoja_servicios.mergeCells("A2", "J2");
	hoja_servicios.getCell("A2").value = "Servicios";
	hoja_servicios.getRow(2).height = 30;
	hoja_servicios.getCell("A2").fill = {
	  type: "pattern",
	  pattern: "solid",
	  fgColor: {
		argb: "FF963030"
	  }
	};
	hoja_servicios.getCell("A2").font = {
	  name: "Calibri",
	  size: 12,
	  bold: true,
	  color: {
		argb: "FFFFFFFF"
	  }
	};
  
	hoja_servicios.mergeCells("A3", "D3");
	hoja_servicios.getCell("A3").value = "Sub Totales";
	hoja_servicios.getRow(3).height = 30;
  
	//ENCABEZADOS
  
	hoja_servicios.getRow(4).values = [
		"Nro",
		"Origen",
		"Nro Boleta",
		"Fecha y hora de solicitud",
		"Concepto",
		"Razón Social",
		"Ingreso Soles", 
		"Egreso Soles", 
		"Ingreso Dólares",
		"Egreso Dólares"
	];
  
	["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4", "J4"].map(key => {
		hoja_servicios.getCell(key).alignment = {
		horizontal: "center",
		vertical: "middle",
		wrapText: true
	  };
	});
  
	hoja_servicios.getRow(4).height = 50;
  
	//IDENTIFICADORES COLUMNAS
	hoja_servicios.columns = [
		{
			key: "nro",
			width: 5
		},
		{
			key: "oficina_nombre",
			width: 27
		},
		{
			key: "nro_Solicitud",
			width: 13
		},
		{
			key: "fecha_hora_operacion",
			width: 20
		},
		{
			key: "concepto",
			width: 37
		},
		{
			key: "cliente_razon_social",
			width: 37
		},
		{
			key: "moneda1_ingre",
			width: 17
		},
		{
			key: "moneda1_egre",
			width: 12
		},
		{
			key: "moneda2_ingre",
			width: 10
		},
		{
			key: "moneda2_egre",
			width: 10
		}
	];
  
	hoja_servicios.getCell("A3").font = {
	  name: "Calibri",
	  size: 12,
	  bold: true,
	  color: {
		argb: "FFFFFFFF"
	  }
	};
  
	["F3", "G3", "H3", "I3", "J3"].map(key => {
		hoja_servicios.getCell(key).font = {
		name: "Calibri",
		size: 11,
		bold: false,
		color: {
		  argb: "FFFFFFFF"
		}
	  };
	});
	//ESTILOS FILAS 3 Y 4
	["A3", "B3", "C3", "D3", "E3", "F3", "G3", "H3", "I3", "J3"].map(key => {
		hoja_servicios.getCell(key).fill = {
		type: "pattern",
		pattern: "solid",
		fgColor: {
		  argb: "FF963030"
		}
	  };
	});
  
	["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4", "J4"].map(key => {
		hoja_servicios.getCell(key).fill = {
		type: "pattern",
		pattern: "solid",
		fgColor: {
		  argb: "FFE69696"
		}
	  };
	});
  
	["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4", "J4"].map(key => {
		hoja_servicios.getCell(key).font = {
		name: "Calibri",
		size: 11,
		bold: true,
		color: {
		  argb: "FF000000"
		}
	  };
	});
	["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4", "J4"].map(key => {
		hoja_servicios.getCell(key).border = {
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
	hoja_servicios.getColumn(4).numFmt = "dd/mm/yyyy h:mm";
	hoja_servicios.getColumn(7).numFmt = '_-"S/."* #,##0.00_-;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';
	hoja_servicios.getColumn(8).numFmt = '_-"S/."* #,##0.00_-;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';
	hoja_servicios.getColumn(9).numFmt = '_-"$."* #,##0.00_-;-"$."* #,##0.00_-;_-"$."* "-"??_-;_-@_-';
	hoja_servicios.getColumn(10).numFmt = '_-"$."* #,##0.00_-;-"$."* #,##0.00_-;_-"$."* "-"??_-;_-@_-';
  
	//AGREGAR FILAS
	hoja_servicios.addRows(listaServicios);
	//FORMULAS
	hoja_servicios.getCell("G3").value = {
	  formula: "SUM(G5:G10000)"
	};
	hoja_servicios.getCell("H3").value = {
	  formula: "SUM(H5:H10000)"
	};
	hoja_servicios.getCell("I3").value = {
	  formula: "SUM(I5:I10000)"
	};
	hoja_servicios.getCell("J3").value = {
	  formula: "SUM(J5:J10000)"
	};
	//FILTROS
	hoja_servicios.autoFilter = {
	  from: {
		row: 4,
		column: 1
	  },
	  to: {
		row: 10000,
		column: 10
	  }
	};

	return hoja_servicios;
  }