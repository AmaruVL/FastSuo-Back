DROP FUNCTION IF EXISTS rep_giros_general;
CREATE OR REPLACE FUNCTION rep_giros_general(
    IN oficina_origen character varying DEFAULT '*',
	IN oficina_destino character varying DEFAULT '*',
	IN nombre_beneficiario VARCHAR(100) DEFAULT '*',
	IN estado integer DEFAULT 0,
	IN importe_inicial DECIMAL DEFAULT 0.000,
	IN importe_final DECIMAL DEFAULT 0.000,
    IN fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE,
    IN fecha_final TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE
  )
  RETURNS TABLE (
	nro BIGINT ,
	oficinaOrigen VARCHAR(20),
    oficinaDestino VARCHAR(20),
    "nro_Solicitud" text,
    beneficiario_razon_social VARCHAR(100),
    solicitante_razon_social VARCHAR(100),
    solicitud_fecha_hora TIMESTAMP WITH TIME ZONE,
	op_documento_codigo VARCHAR(4),
	op_documento_serie INTEGER,
	op_nro_operacion INTEGER,
	op_fecha_hora TIMESTAMP WITH TIME ZONE,
	anulacion_fecha_hora TIMESTAMP WITH TIME ZONE,
    importe_soles DECIMAL(10, 3),
    comision_dt DECIMAL(10, 3),
    importe_dolares DECIMAL(10, 3),
    comision_banco DECIMAL(10, 3),
	otros DECIMAL(10,3),
    st_estado integer,
	foto boolean
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN
      RETURN QUERY
        select row_number() OVER (ORDER BY "Giro"."St_documento_codigo","Giro"."St_documento_serie","Giro"."nro_Solicitud" ASC, 
								  "Giro"."solicitud_fecha_hora" ASC) "nro",
		OOrig.oficina_nombre,ODest.oficina_nombre,
		("Giro"."St_documento_codigo"||"Giro"."St_documento_serie"||'-'||"Giro"."nro_Solicitud") as nro_operacion,
		"Giro".beneficiario_razon_social,"Giro".solicitante_razon_social,"Giro".solicitud_fecha_hora,
		"Giro".op_documento_codigo, "Giro".op_documento_serie, "Giro".op_nro_operacion, 
		"Giro"."op_fecha_hora","Giro".anulacion_fecha_hora,
		    CASE "Giro"."moneda"
			    WHEN '1' THEN "Giro"."importe":: DECIMAL(10, 3) ELSE (0.000):: DECIMAL(10, 3) END AS "importe_soles",
		      "Giro"."comision_dt":: DECIMAL(10, 3),
	    	CASE "Giro"."moneda"
			    WHEN '2' THEN "Giro"."importe":: DECIMAL(10, 3) ELSE (0.000):: DECIMAL(10, 3) END AS "importe_dolares",
		      COALESCE( "Giro"."comision_banco",(0.000):: DECIMAL(10, 3)) as "comision_banco",
			 COALESCE( "Giro".gastos_administrativos,(0.000):: DECIMAL(10, 3)) as "otros",
		    "Giro".st_estado, "Giro".foto 
        from public.transferencia as "Giro" 
        inner join oficina OOrig on "Giro"."oficina_codigo_origen"=OOrig."oficina_codigo"
		inner join oficina ODest on "Giro"."oficina_codigo_destino"=ODest."oficina_codigo"
        where
        (CASE WHEN oficina_origen != '*' THEN "Giro"."oficina_codigo_origen" = oficina_origen ELSE TRUE END)
        and (CASE WHEN oficina_destino != '*' THEN "Giro"."oficina_codigo_destino" = oficina_destino ELSE TRUE END)
		and (CASE when estado = 5 then "Giro".st_estado in (1,2) 
			WHEN estado != 0 THEN "Giro".st_estado = estado else TRUE END) 
		and (CASE WHEN nombre_beneficiario = '*' THEN TRUE 
             ELSE "Giro"."beneficiario_razon_social" ilike ('%' ||nombre_beneficiario|| '%') END)
        and (CASE when estado = 2 then "Giro"."op_fecha_hora" 
						BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
						AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') 
			 	  when estado = 3 then "Giro"."anulacion_fecha_hora" 
						BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
						AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET')
			 	 when estado = 4 then "Giro"."anulacion_fecha_hora" 
						BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
						AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET')
			 else "Giro"."solicitud_fecha_hora" 
						BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
						AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET')
			end)
		and (case when importe_inicial = 0 and importe_final = 0 then true else importe_inicial<="Giro".importe and "Giro".importe<=importe_final end);
	  END;
  $BODY$;