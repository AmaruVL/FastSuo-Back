DROP FUNCTION IF EXISTS saldos_giros;
CREATE OR REPLACE FUNCTION saldos_giros(
	IN fecha_inicio TIMESTAMP WITH TIME ZONE ,
    IN fecha_final TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
	oficina_codigo character varying,
	oficina_nombre character varying,
	oficina_tipo character varying,
	habilitaciones numeric,
	pendientes numeric,
	recaudadas numeric,
	registradas numeric,
	pagadas numeric
)
LANGUAGE 'plpgsql'    
  AS $BODY$
    BEGIN 
	RETURN QUERY 
		select Ofi.oficina_codigo, Ofi.oficina_nombre,Ofi.oficina_tipo,
		(COALESCE(Habi_e.totalImprte,0)-COALESCE(Habi_a.totalImprte,0)) as habilitaciones,
		COALESCE(pend.totalImprte,0) as pendientes,
		COALESCE(rec.totalImprte,0) as recaudadas,		
		COALESCE(reg.totalImprte,0) as registradas,
		COALESCE(pag.totalImprte,0) as pagadas
		from ( oficina as Ofi inner join empresa ON empresa.empresa_codigo = Ofi.empresa_codigo)
			--habiltiaciones enviadas
			left join ( select origen_oficina_codigo, sum(importe) as totalImprte
						from habilitacion 
						where habilitacion_estado  in ('PENDIENTE','ACEPTADO') 
						and "updatedAt" BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
						and ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') 
					   	and origen_docu_serie != 9999
						group by origen_oficina_codigo) as Habi_e
			on Habi_e.origen_oficina_codigo = Ofi.oficina_codigo
			--habiltiaciones aceptadas
			left join ( select destino_oficina_codigo, sum(importe) as totalImprte
						from habilitacion 
						where habilitacion_estado  in ('ACEPTADO')
					   	and "updatedAt" BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
						and ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') 
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
									WHEN "Giro"."anulacion_fecha_hora" BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
										AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET')  THEN 
										3
									WHEN "Giro"."op_fecha_hora" BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
										AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') THEN 
										2
									ELSE 1
								END AS "st_estado"
								from transferencia AS "Giro"
							) as filtroTransferencia
						where st_estado = 1
						and solicitud_fecha_hora BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
								AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET')
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
									WHEN "Giro"."anulacion_fecha_hora" BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
										AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') THEN 
										3
									WHEN "Giro"."op_fecha_hora" BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
										AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') THEN 
										2
									ELSE 1
								END AS "st_estado"
								from transferencia AS "Giro"
							) as filtroTransferencia

					   	where st_estado in (1, 2)
							and solicitud_fecha_hora BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
										AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET')
					   	and "St_documento_serie" != 999
						group by oficina_codigo_origen) as rec 
			on rec.oficina_codigo_origen = Ofi.oficina_codigo
			--registradas
			left join ( select oficina_codigo_destino, sum(importe + COALESCE(comision_banco,0)) as totalImprte
						from (
							select 
								importe, comision_dt, comision_banco, 
								gastos_administrativos, solicitud_fecha_hora,  op_fecha_hora,
								oficina_codigo_origen, oficina_codigo_destino, "St_documento_serie",
								CASE 
									WHEN "Giro"."anulacion_fecha_hora" BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
										AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') THEN 
										3
									WHEN "Giro"."op_fecha_hora" BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
										AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') THEN 
										2
									ELSE 1
								END AS "st_estado"
								from transferencia AS "Giro"
							) as filtroTransferencia
						where 
					   	st_estado in (1, 2)
							and solicitud_fecha_hora BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
										AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET')
					   	and "St_documento_serie" != 999
						group by oficina_codigo_destino) as reg
			on reg.oficina_codigo_destino = Ofi.oficina_codigo
			--pagadas
			left join ( select oficina_codigo_destino, sum(importe + COALESCE(comision_banco,0)) as totalImprte
						from (
							select 
								importe, comision_dt, comision_banco, 
								gastos_administrativos, solicitud_fecha_hora, op_fecha_hora,
								oficina_codigo_origen, oficina_codigo_destino, "St_documento_serie",
								CASE 
									WHEN "Giro"."anulacion_fecha_hora" BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
										AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') THEN 
										3
									WHEN "Giro"."op_fecha_hora" BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
										AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') THEN 
										2
									ELSE 1
								END AS "st_estado"
								from transferencia AS "Giro"
							) as filtroTransferencia
						where st_estado = 2
						and op_fecha_hora BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
										AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET')
						group by oficina_codigo_destino) as pag 
			on pag.oficina_codigo_destino = Ofi.oficina_codigo

		order by Ofi.oficina_tipo,Ofi.oficina_nombre;
	END;
$BODY$;

---/////////////////////////////////////----
DROP FUNCTION IF EXISTS saldos_giros2;
CREATE OR REPLACE FUNCTION saldos_giros2(
	IN fecha_inicio TIMESTAMP WITH TIME ZONE ,
    IN fecha_final TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
	oficina_codigo character varying,
	oficina_nombre character varying,
	oficina_tipo character varying,
	habilitaciones numeric,
	pendientes numeric,
	recaudadas numeric,
	registradas numeric,
	pagadas numeric,
	dt_anuladas numeric,
	camb_dest numeric
)
LANGUAGE 'plpgsql'    
  AS $BODY$
    BEGIN 
	RETURN QUERY 
		select Ofi.oficina_codigo, Ofi.oficina_nombre,Ofi.oficina_tipo,
		(COALESCE(Habi_e.totalImprte,0)-COALESCE(Habi_a.totalImprte,0)) as habilitaciones,
		COALESCE(pend.totalImprte,0) as pendientes,
		COALESCE(rec.totalImprte,0) as recaudadas,		
		COALESCE(reg.totalImprte,0) as registradas,
		COALESCE(pag.totalImprte,0) as pagadas,
		COALESCE(anuladas.totalImprte,0) as dt_anuladas,
		COALESCE(camb_dest.totalImprte,0) as camb_dest 
		from ( oficina as Ofi inner join empresa ON empresa.empresa_codigo = Ofi.empresa_codigo)
			--habiltiaciones enviadas
			left join ( select origen_oficina_codigo, sum(importe) as totalImprte
						from habilitacion 
						where habilitacion_estado  in ('PENDIENTE','ACEPTADO') 
						and "updatedAt" BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
						and ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') 
					   	and origen_docu_serie != 9999
						group by origen_oficina_codigo) as Habi_e
			on Habi_e.origen_oficina_codigo = Ofi.oficina_codigo
			--habiltiaciones aceptadas
			left join ( select destino_oficina_codigo, sum(importe) as totalImprte
						from habilitacion 
						where habilitacion_estado  in ('ACEPTADO')
					   	and "updatedAt" BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
						and ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') 
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
									WHEN "Giro"."anulacion_fecha_hora" BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
										AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET')  THEN 
										3
									WHEN "Giro"."op_fecha_hora" BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
										AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') THEN 
										2
									ELSE 1
								END AS "st_estado"
								from transferencia AS "Giro"
							) as filtroTransferencia
						where st_estado = 1
						and solicitud_fecha_hora BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
								AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET')
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
									WHEN "Giro"."anulacion_fecha_hora" BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
										AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') THEN 
										3
									WHEN "Giro"."op_fecha_hora" BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
										AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') THEN 
										2
									ELSE 1
								END AS "st_estado"
								from transferencia AS "Giro"
							) as filtroTransferencia

					   	where st_estado in (1, 2)
							and solicitud_fecha_hora BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
										AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET')
					   	and "St_documento_serie" != 999
						group by oficina_codigo_origen) as rec 
			on rec.oficina_codigo_origen = Ofi.oficina_codigo
			--registradas
			left join ( select oficina_codigo_destino, sum(importe + COALESCE(comision_banco,0)) as totalImprte
						from (
							select 
								importe, comision_dt, comision_banco, 
								gastos_administrativos, solicitud_fecha_hora,  op_fecha_hora,
								oficina_codigo_origen, oficina_codigo_destino, "St_documento_serie",
								CASE 
									WHEN "Giro"."anulacion_fecha_hora" BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
										AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') THEN 
										3
									WHEN "Giro"."op_fecha_hora" BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
										AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') THEN 
										2
									ELSE 1
								END AS "st_estado"
								from transferencia AS "Giro"
							) as filtroTransferencia
						where 
					   	st_estado in (1, 2)
							and solicitud_fecha_hora BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
										AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET')
					   	and "St_documento_serie" != 999
						group by oficina_codigo_destino) as reg
			on reg.oficina_codigo_destino = Ofi.oficina_codigo
			--pagadas
			left join ( select oficina_codigo_destino, sum(importe + COALESCE(comision_banco,0)) as totalImprte
						from (
							select 
								importe, comision_dt, comision_banco, 
								gastos_administrativos, solicitud_fecha_hora, op_fecha_hora,
								oficina_codigo_origen, oficina_codigo_destino, "St_documento_serie",
								CASE 
									WHEN "Giro"."anulacion_fecha_hora" BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
										AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') THEN 
										3
									WHEN "Giro"."op_fecha_hora" BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
										AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') THEN 
										2
									ELSE 1
								END AS "st_estado"
								from transferencia AS "Giro"
							) as filtroTransferencia
						where st_estado = 2
						and op_fecha_hora BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
										AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET')
						group by oficina_codigo_destino) as pag 
			on pag.oficina_codigo_destino = Ofi.oficina_codigo
			--anuladas
			left join ( select oficina_codigo_origen, sum(COALESCE(comision_dt,0)) as totalImprte
						from transferencia
						where st_estado = 4
						and anulacion_fecha_hora BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
										AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET')
						group by oficina_codigo_origen) as anuladas 
			on anuladas.oficina_codigo_origen = Ofi.oficina_codigo
			--cambio destino
			left join ( select oficina_codigo_origen, sum(COALESCE(comision_dt,0)) as totalImprte
						from transferencia
						where gastos_administrativos > 0
						and "updatedAt" BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
										AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET')
						group by oficina_codigo_origen) as camb_dest 
			on camb_dest.oficina_codigo_origen = Ofi.oficina_codigo

		order by Ofi.oficina_tipo,Ofi.oficina_nombre;
	END;
$BODY$;
