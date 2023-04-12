DROP FUNCTION IF EXISTS saldos_contables;
CREATE OR REPLACE FUNCTION saldos_contables(
	IN fechaFin timestamp with time zone DEFAULT CURRENT_DATE,
	IN oficina VARCHAR(12) DEFAULT '*'
)
RETURNS TABLE (
	empresa_codigo character varying,
	razon_social character varying,
	oficina_codigo character varying,
	oficina_nombre character varying,
	oficina_tipo character varying,
	tipo_arreglo character varying,
	saldoanterior numeric,
	saldo_contable numeric,
	saldo_real numeric,
	acreedor numeric,
	deudor numeric,
	pendientes numeric,
	recaudadas numeric,
	recibidas numeric,
	pagadas numeric,
	dt_anuladas numeric,
	camb_dest numeric
)
LANGUAGE 'plpgsql'    
  AS $BODY$
    BEGIN 
	RETURN QUERY 
		select 
			empresa.empresa_codigo, 
			empresa.razon_social, 
			Ofi.oficina_codigo, 
			Ofi.oficina_nombre,
			Ofi.oficina_tipo,
			Ofi.tipo_arreglo,
			--COALESCE((COALESCE(hab_origen_migracion.totalImprte,0)-COALESCE(hab_destino_migracion.totalImprte,0)+),0) as anterior,
			--COALESCE(hab_origen_migracion.totalImprte,0) as origen_migr,
			--COALESCE(hab_destino_migracion.totalImprte,0) as dest_migr,
			--COALESCE(giros_migracion.totalImprte,0) as girospendietne,
			(CASE 
				WHEN Ofi.tipo_arreglo = 'REAL' THEN 
					COALESCE(hab_origen_migracion.totalImprte,0) - COALESCE(hab_destino_migracion.totalImprte,0)
				ELSE  
					COALESCE(hab_origen_migracion.totalImprte,0) - COALESCE(hab_destino_migracion.totalImprte,0) + COALESCE(giros_migracion.totalImprte,0)
			END) as saldoanterior,
		
			(((COALESCE(rec.totalImprte,0)
			+ COALESCE(Habi_a.totalImprte,0)
			+ COALESCE(anuladas.totalImprte,0)
			- COALESCE(Habi_e.totalImprte  ,0)
			- COALESCE(recibidas.totalImprte,0))

			-
			(	COALESCE(hab_origen_migracion.totalImprte,0)
				-COALESCE(hab_destino_migracion.totalImprte,0) 
				+ COALESCE(giros_migracion.totalImprte,0)
			)) )* -1 as saldo_contable,
			 
			((COALESCE(rec.totalImprte,0)
			+ COALESCE(Habi_a.totalImprte,0)
			+ COALESCE(anuladas.totalImprte,0)
			- COALESCE(Habi_e.totalImprte  ,0)
			- COALESCE(pag.totalImprte,0))

			-
			(	COALESCE(hab_origen_migracion.totalImprte,0) 
			- COALESCE(hab_destino_migracion.totalImprte,0)
			) )* -1 as saldo_real,
			
		
		COALESCE(Habi_e.totalImprte,0) as acreedor,	
		COALESCE(Habi_a.totalImprte,0) as deudor,
		COALESCE(pend.totalImprte,0) as pendientes,
		COALESCE(rec.totalImprte,0) as recaudadas,
		COALESCE(recibidas.totalImprte,0) as recibidas,
		COALESCE(pag.totalImprte,0) as pagadas,
		COALESCE(anuladas.totalImprte,0) as dt_anuladas,
		COALESCE(camb_dest.totalImprte,0) as camb_dest
		
		from ( oficina as Ofi inner join empresa ON empresa.empresa_codigo = Ofi.empresa_codigo)
			--habilitaciones origen sistema anterior
			left join ( select 
					   		origen_oficina_codigo, 
					   		sum(importe) as totalImprte
						from habilitacion 
					   	where origen_docu_serie = 9999
						group by origen_oficina_codigo) as hab_origen_migracion
			on hab_origen_migracion.origen_oficina_codigo = Ofi.oficina_codigo
			--habilitaciones destino sistema anterior
			left join ( select 
					   		destino_oficina_codigo, 
					   		sum(importe) as totalImprte
						from habilitacion 
					   	where origen_docu_serie = 9999
						group by destino_oficina_codigo)  as hab_destino_migracion
			on hab_destino_migracion.destino_oficina_codigo = Ofi.oficina_codigo
			--giros sistema anterior
			left join ( select 
					   		oficina_codigo_destino, 
					   		sum(importe) as totalImprte
						from transferencia 
					   	where "St_documento_serie" = 999
						group by oficina_codigo_destino)  as giros_migracion
			on giros_migracion.oficina_codigo_destino = Ofi.oficina_codigo
			
			--PEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
	
			--EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
			
			--habiltiaciones enviadas
			left join ( select origen_oficina_codigo, sum(importe) as totalImprte
						from habilitacion 
						where habilitacion_estado  in ('PENDIENTE','ACEPTADO')
							and "updatedAt" < ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')
					   	and origen_docu_serie != 9999
						group by origen_oficina_codigo) as Habi_e
			on Habi_e.origen_oficina_codigo = Ofi.oficina_codigo
			--habiltiaciones aceptadas
			left join ( select destino_oficina_codigo, sum(importe) as totalImprte
						from habilitacion 
						where habilitacion_estado  in ('ACEPTADO')
							and "updatedAt" < ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')
					   	and destino_documento_serie != 9999
						group by destino_oficina_codigo) as Habi_a
			on Habi_a.destino_oficina_codigo = Ofi.oficina_codigo
			--pendientes
			left join ( select oficina_codigo_destino, sum(importe) as totalImprte
						from (
							select 
								importe, comision_dt, comision_banco, 
								gastos_administrativos, solicitud_fecha_hora,  op_fecha_hora,
								oficina_codigo_origen, oficina_codigo_destino, "St_documento_serie",
								CASE 
									WHEN ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')> "Giro"."anulacion_fecha_hora"  THEN 
										3
									WHEN ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')> "Giro"."op_fecha_hora"  THEN 
										2
									ELSE 1
								END AS "st_estado"
								from transferencia AS "Giro"
							) as filtroTransferencia
						where st_estado = 1
						and solicitud_fecha_hora < ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')
						group by oficina_codigo_destino) as pend 
			on pend.oficina_codigo_destino = Ofi.oficina_codigo
			--recaudadas
			left join ( select oficina_codigo_origen, sum(importe + COALESCE(comision_dt,0) + COALESCE(comision_banco,0) + COALESCE(gastos_administrativos,0)) as totalImprte
						from (
							select 
								importe, comision_dt, comision_banco, 
								gastos_administrativos, solicitud_fecha_hora,  op_fecha_hora,
								oficina_codigo_origen, oficina_codigo_destino, "St_documento_serie",
								CASE 
									WHEN ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')> "Giro"."anulacion_fecha_hora"  THEN 
										3
									WHEN ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')> "Giro"."op_fecha_hora"  THEN 
										2
									ELSE 1
								END AS "st_estado"
								from transferencia AS "Giro"
							) as filtroTransferencia

					   	where st_estado in (1, 2)
							and solicitud_fecha_hora < ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')
					   	and "St_documento_serie" != 999
						group by oficina_codigo_origen) as rec 
			on rec.oficina_codigo_origen = Ofi.oficina_codigo
			--recibidas
			left join ( select oficina_codigo_destino, sum(importe + COALESCE(comision_banco,0)) as totalImprte
						from (
							select 
								importe, comision_dt, comision_banco, 
								gastos_administrativos, solicitud_fecha_hora,  op_fecha_hora,
								oficina_codigo_origen, oficina_codigo_destino, "St_documento_serie",
								CASE 
									WHEN ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')> "Giro"."anulacion_fecha_hora"  THEN 
										3
									WHEN ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')> "Giro"."op_fecha_hora"  THEN 
										2
									ELSE 1
								END AS "st_estado"
								from transferencia AS "Giro"
							) as filtroTransferencia
						where 
					   	st_estado in (1, 2)
							and solicitud_fecha_hora < ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')
					   	and "St_documento_serie" != 999
						group by oficina_codigo_destino) as recibidas
			on recibidas.oficina_codigo_destino = Ofi.oficina_codigo
			--pagadas
			left join ( select oficina_codigo_destino, sum(importe + COALESCE(comision_banco,0)) as totalImprte
						from (
							select 
								importe, comision_dt, comision_banco, 
								gastos_administrativos, solicitud_fecha_hora, op_fecha_hora,
								oficina_codigo_origen, oficina_codigo_destino, "St_documento_serie",
								CASE 
									WHEN ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')> "Giro"."anulacion_fecha_hora"  THEN 
										3
									WHEN ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')> "Giro"."op_fecha_hora"  THEN 
										2
									ELSE 1
								END AS "st_estado"
								from transferencia AS "Giro"
							) as filtroTransferencia
						where st_estado = 2
						and op_fecha_hora < ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')
						group by oficina_codigo_destino) as pag 
			on pag.oficina_codigo_destino = Ofi.oficina_codigo
			--anuladas
			left join ( select oficina_codigo_origen, sum(COALESCE(comision_dt,0)) as totalImprte
						from transferencia
						where st_estado = 4
						and anulacion_fecha_hora < ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')
						group by oficina_codigo_origen) as anuladas 
			on anuladas.oficina_codigo_origen = Ofi.oficina_codigo
			--cambio destino
			left join ( select oficina_codigo_origen, sum(COALESCE(comision_dt,0)) as totalImprte
						from transferencia
						where gastos_administrativos > 0
						and "updatedAt" < ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')
						group by oficina_codigo_origen) as camb_dest 
			on camb_dest.oficina_codigo_origen = Ofi.oficina_codigo
		WHERE  (
            CASE 
              WHEN oficina != '*' THEN 
                Ofi.oficina_codigo = oficina
              ELSE TRUE 
            END)
		
		order by Ofi.oficina_tipo,Ofi.oficina_nombre;
		
	END;
$BODY$;

DROP FUNCTION IF EXISTS saldos_contables_empresas;
CREATE OR REPLACE FUNCTION saldos_contables_empresas(
	IN fechaFin timestamp with time zone DEFAULT CURRENT_DATE,
	IN oficina VARCHAR(12) DEFAULT '*'
)
RETURNS TABLE (
	empresa_codigo character varying,
	razon_social character varying,
	saldoanterior numeric,
	saldo_contable numeric,
	saldo_real numeric,
	acreedor numeric,
	deudor numeric,
	pendientes numeric,
	recaudadas numeric,
	recibidas numeric,
	pagadas numeric,
	dt_anuladas numeric,
	camb_dest numeric
)
LANGUAGE 'plpgsql'    
  AS $BODY$
    BEGIN 
	RETURN QUERY 
		select empr.empresa_codigo,empr.razon_social,sum(empr.saldoanterior),sum(empr.saldo_contable),
		sum(empr.saldo_real),
		sum(empr.acreedor),sum(empr.deudor),sum(empr.pendientes),sum(empr.recaudadas),sum(empr.recibidas),
		sum(empr.pagadas),
		sum(empr.dt_anuladas),sum(empr.camb_dest) from (
		select 
			empresa.empresa_codigo, 
			empresa.razon_social,
			--COALESCE((COALESCE(hab_origen_migracion.totalImprte,0)-COALESCE(hab_destino_migracion.totalImprte,0)+),0) as anterior,
			--COALESCE(hab_origen_migracion.totalImprte,0) as origen_migr,
			--COALESCE(hab_destino_migracion.totalImprte,0) as dest_migr,
			--COALESCE(giros_migracion.totalImprte,0) as girospendietne,
			(CASE 
				WHEN Ofi.tipo_arreglo = 'REAL' THEN 
					COALESCE(hab_origen_migracion.totalImprte,0) - COALESCE(hab_destino_migracion.totalImprte,0)
				ELSE  
					COALESCE(hab_origen_migracion.totalImprte,0) - COALESCE(hab_destino_migracion.totalImprte,0) + COALESCE(giros_migracion.totalImprte,0)
			END) as saldoanterior,
		
			(((COALESCE(rec.totalImprte,0)
			+ COALESCE(Habi_a.totalImprte,0)
			+ COALESCE(anuladas.totalImprte,0)
			- COALESCE(Habi_e.totalImprte  ,0)
			- COALESCE(recibidas.totalImprte,0))

			-
			(	COALESCE(hab_origen_migracion.totalImprte,0)
				-COALESCE(hab_destino_migracion.totalImprte,0) 
				+ COALESCE(giros_migracion.totalImprte,0)
			)) )* -1 as saldo_contable,
			 
			((COALESCE(rec.totalImprte,0)
			+ COALESCE(Habi_a.totalImprte,0)
			+ COALESCE(anuladas.totalImprte,0)
			- COALESCE(Habi_e.totalImprte  ,0)
			- COALESCE(pag.totalImprte,0))

			-
			(	COALESCE(hab_origen_migracion.totalImprte,0) 
			- COALESCE(hab_destino_migracion.totalImprte,0)
			) )* -1 as saldo_real,
			
		
		COALESCE(Habi_e.totalImprte,0) as acreedor,	
		COALESCE(Habi_a.totalImprte,0) as deudor,
		COALESCE(pend.totalImprte,0) as pendientes,
		COALESCE(rec.totalImprte,0) as recaudadas,
		COALESCE(recibidas.totalImprte,0) as recibidas,
		COALESCE(pag.totalImprte,0) as pagadas,
		COALESCE(anuladas.totalImprte,0) as dt_anuladas,
		COALESCE(camb_dest.totalImprte,0) as camb_dest
		
		from ( oficina as Ofi inner join empresa ON empresa.empresa_codigo = Ofi.empresa_codigo)
			--habilitaciones origen sistema anterior
			left join ( select 
					   		origen_oficina_codigo, 
					   		sum(importe) as totalImprte
						from habilitacion 
					   	where origen_docu_serie = 9999
						group by origen_oficina_codigo) as hab_origen_migracion
			on hab_origen_migracion.origen_oficina_codigo = Ofi.oficina_codigo
			--habilitaciones destino sistema anterior
			left join ( select 
					   		destino_oficina_codigo, 
					   		sum(importe) as totalImprte
						from habilitacion 
					   	where origen_docu_serie = 9999
						group by destino_oficina_codigo)  as hab_destino_migracion
			on hab_destino_migracion.destino_oficina_codigo = Ofi.oficina_codigo
			--giros sistema anterior
			left join ( select 
					   		oficina_codigo_destino, 
					   		sum(importe) as totalImprte
						from transferencia 
					   	where "St_documento_serie" = 999
						group by oficina_codigo_destino)  as giros_migracion
			on giros_migracion.oficina_codigo_destino = Ofi.oficina_codigo
			
			--PEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
	
			--EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
			
			--habiltiaciones enviadas
			left join ( select origen_oficina_codigo, sum(importe) as totalImprte
						from habilitacion 
						where habilitacion_estado  in ('PENDIENTE','ACEPTADO')
							and "updatedAt" < ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')
					   	and origen_docu_serie != 9999
						group by origen_oficina_codigo) as Habi_e
			on Habi_e.origen_oficina_codigo = Ofi.oficina_codigo
			--habiltiaciones aceptadas
			left join ( select destino_oficina_codigo, sum(importe) as totalImprte
						from habilitacion 
						where habilitacion_estado  in ('ACEPTADO')
							and "updatedAt" < ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')
					   	and destino_documento_serie != 9999
						group by destino_oficina_codigo) as Habi_a
			on Habi_a.destino_oficina_codigo = Ofi.oficina_codigo
			--pendientes
			left join ( select oficina_codigo_destino, sum(importe) as totalImprte
						from (
							select 
								importe, comision_dt, comision_banco, 
								gastos_administrativos, solicitud_fecha_hora,  op_fecha_hora,
								oficina_codigo_origen, oficina_codigo_destino, "St_documento_serie",
								CASE 
									WHEN ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')> "Giro"."anulacion_fecha_hora"  THEN 
										3
									WHEN ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')> "Giro"."op_fecha_hora"  THEN 
										2
									ELSE 1
								END AS "st_estado"
								from transferencia AS "Giro"
							) as filtroTransferencia
						where st_estado = 1
						and solicitud_fecha_hora < ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')
						group by oficina_codigo_destino) as pend 
			on pend.oficina_codigo_destino = Ofi.oficina_codigo
			--recaudadas
			left join ( select oficina_codigo_origen, sum(importe + COALESCE(comision_dt,0) + COALESCE(comision_banco,0) + COALESCE(gastos_administrativos,0)) as totalImprte
						from (
							select 
								importe, comision_dt, comision_banco, 
								gastos_administrativos, solicitud_fecha_hora,  op_fecha_hora,
								oficina_codigo_origen, oficina_codigo_destino, "St_documento_serie",
								CASE 
									WHEN ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')> "Giro"."anulacion_fecha_hora"  THEN 
										3
									WHEN ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')> "Giro"."op_fecha_hora"  THEN 
										2
									ELSE 1
								END AS "st_estado"
								from transferencia AS "Giro"
							) as filtroTransferencia

					   	where st_estado in (1, 2)
							and solicitud_fecha_hora < ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')
					   	and "St_documento_serie" != 999
						group by oficina_codigo_origen) as rec 
			on rec.oficina_codigo_origen = Ofi.oficina_codigo
			--recibidas
			left join ( select oficina_codigo_destino, sum(importe + COALESCE(comision_banco,0)) as totalImprte
						from (
							select 
								importe, comision_dt, comision_banco, 
								gastos_administrativos, solicitud_fecha_hora,  op_fecha_hora,
								oficina_codigo_origen, oficina_codigo_destino, "St_documento_serie",
								CASE 
									WHEN ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')> "Giro"."anulacion_fecha_hora"  THEN 
										3
									WHEN ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')> "Giro"."op_fecha_hora"  THEN 
										2
									ELSE 1
								END AS "st_estado"
								from transferencia AS "Giro"
							) as filtroTransferencia
						where 
					   	st_estado in (1, 2)
							and solicitud_fecha_hora < ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')
					   	and "St_documento_serie" != 999
						group by oficina_codigo_destino) as recibidas
			on recibidas.oficina_codigo_destino = Ofi.oficina_codigo
			--pagadas
			left join ( select oficina_codigo_destino, sum(importe + COALESCE(comision_banco,0)) as totalImprte
						from (
							select 
								importe, comision_dt, comision_banco, 
								gastos_administrativos, solicitud_fecha_hora, op_fecha_hora,
								oficina_codigo_origen, oficina_codigo_destino, "St_documento_serie",
								CASE 
									WHEN ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')> "Giro"."anulacion_fecha_hora"  THEN 
										3
									WHEN ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')> "Giro"."op_fecha_hora"  THEN 
										2
									ELSE 1
								END AS "st_estado"
								from transferencia AS "Giro"
							) as filtroTransferencia
						where st_estado = 2
						and op_fecha_hora < ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')
						group by oficina_codigo_destino) as pag 
			on pag.oficina_codigo_destino = Ofi.oficina_codigo
			--anuladas
			left join ( select oficina_codigo_origen, sum(COALESCE(comision_dt,0)) as totalImprte
						from transferencia
						where st_estado = 4
						and anulacion_fecha_hora < ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')
						group by oficina_codigo_origen) as anuladas 
			on anuladas.oficina_codigo_origen = Ofi.oficina_codigo
			--cambio destino
			left join ( select oficina_codigo_origen, sum(COALESCE(comision_dt,0)) as totalImprte
						from transferencia
						where gastos_administrativos > 0
						and "updatedAt" < ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')
						group by oficina_codigo_origen) as camb_dest 
			on camb_dest.oficina_codigo_origen = Ofi.oficina_codigo
		WHERE  (
            CASE 
              WHEN oficina != '*' THEN 
                Ofi.oficina_codigo = oficina
              ELSE TRUE 
            END)
		
		order by Ofi.oficina_tipo,Ofi.oficina_nombre) empr
		group by empr.empresa_codigo,empr.razon_social;
		
	END;
$BODY$;
