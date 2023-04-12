--ENTIDAD ORIGEN
DROP FUNCTION IF EXISTS reporte_girostotalesOri_fecha;
CREATE OR REPLACE FUNCTION reporte_girostotalesOri_fecha(
	IN opcion_entidad integer default 1,
    IN entidad_codigo character varying DEFAULT '*',
	IN estado integer DEFAULT 0,
    IN fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE,
    IN fecha_final TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE
  )
  RETURNS TABLE (
	fechas DATE,
    total_giros bigint,
    importe DECIMAL(10, 3),
    comision_dt DECIMAL(10, 3),
    comision_banco DECIMAL(10, 3),
    gastos_administrativos DECIMAL(10, 3)
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN
      RETURN QUERY
		select (case when estado in (0,1,5) then date("Giro".solicitud_fecha_hora)
					when estado = 2 then date("Giro".op_fecha_hora)
					when estado in (3,4) then date("Giro".anulacion_fecha_hora) end) as fechas,
			coalesce(count("Giro"."St_documento_codigo"),0) as total_giros,coalesce(sum("Giro"."importe"),0),
			coalesce(sum("Giro"."comision_dt"),0) as comision_dt1,COALESCE( sum("Giro"."comision_banco"),0),
			coalesce(sum("Giro"."gastos_administrativos"),0) 
			from public.transferencia as "Giro" 
				where
					(case opcion_entidad when 1 then "Giro".oficina_codigo_origen in (select oficina_codigo
										from public.oficina
										where  empresa_codigo=entidad_codigo) 
						when opcion_entidad then "Giro".oficina_codigo_origen=entidad_codigo end) 
				and (CASE when estado = 5 then "Giro".st_estado in (1,2) 
					WHEN estado != 0 THEN "Giro".st_estado = estado else TRUE END)
				and (CASE when estado = 2 then "Giro"."op_fecha_hora" 
						BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
						AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') 
			 	  	when estado in (3,4) then "Giro"."anulacion_fecha_hora" 
						BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
						AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET')
			 		else "Giro"."solicitud_fecha_hora" 
						BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
						AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') end)
				group by (fechas)
				order by fechas;
				
  	END;
$BODY$;

--ENTIDAD DESTINO
DROP FUNCTION IF EXISTS reporte_girostotalesDest_fecha;
CREATE OR REPLACE FUNCTION reporte_girostotalesDest_fecha(
	IN opcion_entidad integer default 1,
	IN opcion_fecha integer default 1,
    IN entidad_codigo character varying DEFAULT '*',
	IN estado integer DEFAULT 0,
    IN fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE,
    IN fecha_final TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE
  )
  RETURNS TABLE (
	fechas DATE,
    total_giros bigint,
    importe DECIMAL(10, 2),
	comision_dt DECIMAL(10, 2),
    comision_banco DECIMAL(10, 2),
    otros DECIMAL(10, 2)
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN
      RETURN QUERY
		select 
			(case when opcion_fecha = 1 then date("Giro".solicitud_fecha_hora)
					else date("Giro".op_fecha_hora) end)as fechas,
			coalesce(count("Giro"."St_documento_codigo"),0), 
			coalesce(sum("Giro"."importe"),0)as importe,
			coalesce(sum("Giro"."comision_dt"),0)as comision_dt,
			COALESCE( sum("Giro"."comision_banco"),0)as comision_banco,
			coalesce(sum("Giro"."gastos_administrativos"),0)as gastos_administrativos  
			from public.transferencia as "Giro" 
				where (case opcion_entidad when 1 then "Giro".oficina_codigo_destino in (select oficina_codigo
										from public.oficina
										where  empresa_codigo=entidad_codigo) 
						when 2 then "Giro".oficina_codigo_destino=entidad_codigo end) 
				and (case when opcion_fecha != 1 then "Giro"."op_fecha_hora" 
					BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
					AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') 
				else (
					"Giro"."solicitud_fecha_hora" 
						BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
						AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') 
					AND CASE when estado = 5 then "Giro".st_estado in (1,2) 
						WHEN estado != 0 THEN "Giro".st_estado = estado 							
					else TRUE END)end)			
				group by fechas
				order by fechas;
  	END;
$BODY$;
