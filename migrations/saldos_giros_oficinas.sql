DROP FUNCTION IF EXISTS saldos_giros_oficinas;
CREATE OR REPLACE FUNCTION saldos_giros_oficinas(
	IN in_oficina_codigo VARCHAR(12) DEFAULT '*',
	IN opcion_datos integer DEFAULT 0,
	IN fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE,
    IN fecha_final TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
	oficina_codigo character varying,
	oficina_nombre character varying,
	oficina_tipo character varying,
	recaudadas numeric,
	pagadas numeric
)
LANGUAGE 'plpgsql'    
  AS $BODY$
    BEGIN 
	RETURN QUERY 
		select Ofi.oficina_codigo, Ofi.oficina_nombre,Ofi.oficina_tipo, COALESCE(rec.totalImprte,0) as recaudadas, 
		COALESCE(pag.totalImprte,0) as pagadas
		from ( oficina as Ofi inner join empresa ON empresa.empresa_codigo = Ofi.empresa_codigo)			
			--recaudadas
			left join ( select oficina_codigo_origen, 
						   (case  when opcion_datos = 0 then count(*)  
								  when opcion_datos = 1 then sum(importe + COALESCE(comision_banco,0) + COALESCE(gastos_administrativos,0))
								  when opcion_datos = 2 then sum(comision_dt)
								  else null end) as totalImprte  
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
			--pagadas
			left join ( select oficina_codigo_destino, 
						   (case  when opcion_datos = 0 then count(*)  
									  when opcion_datos = 1 then sum(importe + COALESCE(comision_banco,0))
									  when opcion_datos = 2 then sum(comision_dt)
									  else null end) as totalImprte 
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
		where (CASE WHEN in_oficina_codigo != '*' THEN Ofi.oficina_codigo = in_oficina_codigo ELSE TRUE END)
		group by Ofi.oficina_codigo, Ofi.oficina_nombre,Ofi.oficina_tipo, rec.totalImprte, pag.totalImprte 
		order by Ofi.oficina_tipo,Ofi.oficina_nombre;
	END;
$BODY$;