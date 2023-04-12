--ENTIDAD ORIGEN
DROP FUNCTION IF EXISTS reporte_gerencial_origen2;
CREATE OR REPLACE FUNCTION reporte_gerencial_origen2(
	IN opcion_entidad integer default 1,
	IN ordenar_por integer default 1,
    IN entidad_codigo character varying DEFAULT '*',
	IN estado integer DEFAULT 0,
    IN fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE,
    IN fecha_final TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE
  )
  RETURNS TABLE (
	cod_entidad VARCHAR(20) ,
    nombre_entidad VARCHAR(100),
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
		select (case opcion_entidad when 1 then EmpDestino.empresa_codigo when 2 then OfDestino.oficina_codigo end),
			(case opcion_entidad when 1 then EmpDestino.razon_social when 2 then OfDestino.oficina_nombre end),
			coalesce(count("Giro"."St_documento_codigo"),0) as total_giros,coalesce(sum("Giro"."importe"),0),
			coalesce(sum("Giro"."comision_dt"),0) as comision_dt1,COALESCE( sum("Giro"."comision_banco"),0),
			coalesce(sum("Giro"."gastos_administrativos"),0) 
			from public.transferencia as "Giro" 
				inner join empresa EmpDestino on "Giro".oficina_codigo_destino in (select oficina_codigo
										from public.oficina
										where  empresa_codigo=EmpDestino.empresa_codigo) 
				inner join oficina OfDestino on "Giro".oficina_codigo_destino=OfDestino.oficina_codigo 
				where
					(case opcion_entidad when 1 then "Giro".oficina_codigo_origen in (select oficina_codigo
										from public.oficina
										where  empresa_codigo=entidad_codigo) 
						when opcion_entidad then "Giro".oficina_codigo_origen=entidad_codigo end) 
							and 
					(CASE when estado = 4 then "Giro".st_estado in (1,2) 
								WHEN estado != 0 THEN "Giro".st_estado = estado 							
							else TRUE END)
				and "Giro"."solicitud_fecha_hora" 
								BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
								AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') 
				group by (case opcion_entidad when 1 then EmpDestino.empresa_codigo 
						  when 2 then OfDestino.oficina_codigo end),
					(case opcion_entidad when 1 then EmpDestino.razon_social when 2 then OfDestino.oficina_nombre end)
				,"Giro"."moneda" 
				order by case ordenar_por when 1 then coalesce(count("Giro"."St_documento_codigo"),0) end desc,
						case ordenar_por when 2 then coalesce(sum("Giro"."comision_dt"),0) end desc;
				
  	END;
$BODY$;

--ENTIDAD DESTINO
DROP FUNCTION IF EXISTS reporte_gerencial_destino2;
CREATE OR REPLACE FUNCTION reporte_gerencial_destino2(
	IN opcion_entidad integer default 1,
	IN ordenar_por integer default 1,
    IN entidad_codigo character varying DEFAULT '*',
	IN estado integer DEFAULT 0,
    IN fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE,
    IN fecha_final TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE
  )
  RETURNS TABLE (
	cod_entidad VARCHAR(20) ,
    nombre_entidad VARCHAR(100),
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
		select (case opcion_entidad when 1 then EmpOrigen.empresa_codigo when 2 then OfOrigen.oficina_codigo end),
			(case opcion_entidad when 1 then EmpOrigen.razon_social when 2 then OfOrigen.oficina_nombre end),
			coalesce(count("Giro"."St_documento_codigo"),0), coalesce(sum("Giro"."importe"),0),
			coalesce(sum("Giro".comision_dt),0),
			COALESCE( sum("Giro"."comision_banco"),0) as "comision_banco",
			coalesce(sum("Giro"."gastos_administrativos"),0)  
			from public.transferencia as "Giro" 
				inner join empresa EmpOrigen on "Giro".oficina_codigo_origen in (select oficina_codigo
										from public.oficina
										where  empresa_codigo=EmpOrigen.empresa_codigo) 
				inner join oficina OfOrigen on "Giro".oficina_codigo_origen=OfOrigen.oficina_codigo 
				where (case opcion_entidad when 1 then "Giro".oficina_codigo_destino in (select oficina_codigo
										from public.oficina
										where  empresa_codigo=entidad_codigo) 
						when 2 then "Giro".oficina_codigo_destino=entidad_codigo end) 
				and (CASE when estado = 4 then "Giro".st_estado in (1,2) 
						WHEN estado != 0 THEN "Giro".st_estado = estado  
						else TRUE END)
				and (case when estado!=0 then case when "Giro".st_estado = 2 then "Giro"."op_fecha_hora" 
								BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
								AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') 
							else "Giro"."solicitud_fecha_hora" 
								BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
								AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') end 
					 else "Giro"."solicitud_fecha_hora" 
								BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
								AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') end)					
				group by (case opcion_entidad when 1 then EmpOrigen.empresa_codigo 
						  when 2 then OfOrigen.oficina_codigo end),
					(case opcion_entidad when 1 then EmpOrigen.razon_social 
					 when 2 then OfOrigen.oficina_nombre end) 
				order by case ordenar_por when 1 then coalesce(count("Giro"."St_documento_codigo"),0) end desc,
						case ordenar_por when 2 then coalesce(sum("Giro".comision_dt),0) end desc;
  	END;
$BODY$;