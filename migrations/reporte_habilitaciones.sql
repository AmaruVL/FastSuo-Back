DROP FUNCTION IF EXISTS reporHabilitaciones;
CREATE OR REPLACE FUNCTION reporHabilitaciones(
    IN oficina_codigo_origen character varying default '*',
	IN oficina_codigo_destino character varying default '*',
    IN tipo_hab character varying default '*',
    IN fecha_inicio date DEFAULT CURRENT_DATE,
    IN fecha_final date DEFAULT CURRENT_DATE 
  )
  RETURNS TABLE (
	documento_codigo VARCHAR(4),
	documento_serie integer,
	documento_nro integer,
    oficina_origen VARCHAR(100),
    oficina_destino VARCHAR(100),
	caja_origen VARCHAR(100),
	caja_destino VARCHAR(100),
	tipo VARCHAR(20),
	importe DECIMAL(7, 2),
	moneda VARCHAR(10),
	estado VARCHAR(10),
	fecha TIMESTAMP WITH TIME ZONE
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN
      RETURN QUERY
		select Hab.origen_docu_codigo,Hab.origen_docu_serie,Hab.origen_nro_operacion,OfOrigen.oficina_nombre,
		OfDestino.oficina_nombre, CajOrigen.caja_nombre, CajDestino.caja_nombre, Hab.tipo_habilitacion,
		Hab.importe, Hab.moneda, Hab.habilitacion_estado, Hab."createdAt" from habilitacion Hab
		left outer join oficina OfOrigen on origen_oficina_codigo=OfOrigen.oficina_codigo 
		left outer join oficina OfDestino on destino_oficina_codigo=OfDestino.oficina_codigo 
		left outer join caja CajOrigen on origen_caja_codigo=CajOrigen.caja_codigo 
		left outer join caja CajDestino on destino_caja_codigo=CajDestino.caja_codigo 
		where 
		(CASE WHEN oficina_codigo_origen != '*' THEN Hab.origen_oficina_codigo=oficina_codigo_origen ELSE TRUE END) 
		and 
		(CASE WHEN oficina_codigo_destino != '*' THEN Hab.destino_oficina_codigo=oficina_codigo_destino ELSE TRUE END) 
		and 
		(CASE WHEN tipo_hab != '*' THEN Hab.tipo_habilitacion=tipo_hab ELSE TRUE END) 
		and 
		Hab."createdAt" between ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
        	and ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET');
	  END;
  $BODY$;

--Habilitaciones e Intercambios
DROP FUNCTION IF EXISTS reporHabilitaciones1;
CREATE OR REPLACE FUNCTION reporHabilitaciones1(
    IN in_oficina_codigo_origen character varying default '*',
	IN in_oficina_codigo_destino character varying default '*',
    IN tipo_hab character varying default '*',
    IN fecha_inicio date DEFAULT CURRENT_DATE,
    IN fecha_final date DEFAULT CURRENT_DATE 
  )
  RETURNS TABLE (
	nro bigint,
	documento_codigo VARCHAR(4),
	documento_serie integer,
	documento_nro integer,
    oficina_origen VARCHAR(100),
    oficina_destino VARCHAR(100),
	caja_origen VARCHAR(100),
	caja_destino VARCHAR(100),
	tipo VARCHAR(20),
	importe DECIMAL(7, 2),
	moneda VARCHAR(10),
	estado VARCHAR(10),
	fecha TIMESTAMP WITH TIME ZONE
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN
      RETURN QUERY
	  	select row_number() OVER (order by doc_cod,doc_ser,soli asc), * 
		from (
			(select Hab.origen_docu_codigo as doc_cod,Hab.origen_docu_serie as doc_ser,
			Hab.origen_nro_operacion as soli,OfOrigen.oficina_nombre,
			OfDestino.oficina_nombre, CajOrigen.caja_nombre, CajDestino.caja_nombre, Hab.tipo_habilitacion,
			Hab.importe, Hab.moneda, Hab.habilitacion_estado, Hab."createdAt" from habilitacion Hab
			left outer join oficina OfOrigen on origen_oficina_codigo=OfOrigen.oficina_codigo 
			left outer join oficina OfDestino on destino_oficina_codigo=OfDestino.oficina_codigo 
			left outer join caja CajOrigen on origen_caja_codigo=CajOrigen.caja_codigo 
			left outer join caja CajDestino on destino_caja_codigo=CajDestino.caja_codigo 
			where 
			(CASE WHEN in_oficina_codigo_origen != '*' 
			 	THEN Hab.origen_oficina_codigo=in_oficina_codigo_origen ELSE TRUE END) 
			and 
			(CASE WHEN in_oficina_codigo_destino != '*' 
			 	THEN Hab.destino_oficina_codigo=in_oficina_codigo_destino ELSE TRUE END) 
			and 
			(CASE WHEN tipo_hab != '*' THEN Hab.tipo_habilitacion=tipo_hab ELSE TRUE END) 
			and 
			Hab."createdAt" between ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
				and ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') )
		union all
			 (select "St_documento_codigo" as doc_cod,"St_documento_serie" as doc_ser,"nro_Solicitud" as soli,
			  	OfOrigen.oficina_nombre,OfDestino.oficina_nombre,CajOrigen.caja_nombre,'',
				"tipo_giro",Giro."importe",Giro."moneda","st_estado" :: VARCHAR(20),"solicitud_fecha_hora" 
			  from transferencia Giro 
			  inner join operacion_caja OCaj on ("St_documento_codigo"=OCaj.documento_codigo and 
			  "St_documento_serie"=OCaj.documento_serie and "nro_Solicitud"=OCaj.nro_operacion) 
			  left outer join oficina OfOrigen on Giro."oficina_codigo_origen"=OfOrigen.oficina_codigo 
			  left outer join oficina OfDestino on Giro.oficina_codigo_destino=OfDestino.oficina_codigo 
			  left outer join caja CajOrigen on OCaj.caja_codigo=CajOrigen.caja_codigo 
			  where 
			  (CASE WHEN in_oficina_codigo_origen != '*' 
			   		THEN Giro."oficina_codigo_origen"=in_oficina_codigo_origen ELSE TRUE END) 
			  and 
			  (CASE WHEN in_oficina_codigo_destino != '*' 
			   		THEN Giro.oficina_codigo_destino=in_oficina_codigo_destino ELSE TRUE END) 
			  and 
			  (CASE tipo_hab WHEN '*' THEN Giro."tipo_giro"='Intercambio' when 'Intercambio' then 
			 		Giro."tipo_giro"='Intercambio' END) 
			  and solicitud_fecha_hora between ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
        			and ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET')
			  group by "St_documento_codigo","St_documento_serie","nro_Solicitud",OfOrigen.oficina_nombre,
					OfDestino.oficina_nombre,CajOrigen.caja_nombre,"tipo_giro",Giro."importe",Giro."moneda",
			  		"st_estado","solicitud_fecha_hora")
		)as hab;
	  END;
  $BODY$;