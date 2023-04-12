DROP FUNCTION IF EXISTS recaudadosCaja1;
CREATE OR REPLACE FUNCTION recaudadosCaja1(
  IN in_caja_codigo character varying DEFAULT '*',
	IN nombre_beneficiario VARCHAR(100) DEFAULT '*',
	IN nombre_solicitante VARCHAR(100) DEFAULT '*',
	IN opcion_fecha integer DEFAULT 0,
	IN estado integer DEFAULT 0,
  IN fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE,
  IN fecha_final TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE
  )
  RETURNS TABLE (
	  nro BIGINT ,
    oficinaDestino VARCHAR(20),
    "nro_Solicitud" text,
    beneficiario_razon_social VARCHAR(100),
    solicitante_razon_social VARCHAR(100),
    solicitud_fecha_hora TIMESTAMP WITH TIME ZONE,
	fecha_hora TIMESTAMP WITH TIME ZONE,
    importe_soles DECIMAL(10, 2),
    comision_dt DECIMAL(10, 2),
    gastos_administrativos DECIMAL(10, 3),
    comision_banco DECIMAL(10, 3),
    st_estado integer,
	  solicitud_obs VARCHAR(500),
    st_autorizada integer,
	anulacion_motivo varchar
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN
      RETURN QUERY
        select row_number() OVER (ORDER BY OCaj.documento_codigo,OCaj.documento_serie,OCaj.nro_operacion ASC, 
								  "Giro"."solicitud_fecha_hora" ASC) "nro",
		    "oficina".oficina_nombre,(OCaj.documento_codigo||OCaj.documento_serie||'-'||OCaj.nro_operacion) as nro_operacion,"Giro".beneficiario_razon_social,
        "Giro".solicitante_razon_social,OCaj.fecha_hora_operacion, 
		case "Giro".st_estado when 2 then "Giro"."op_fecha_hora"
							when 3 then "Giro".anulacion_fecha_hora
							when 4 then "Giro".anulacion_fecha_hora end,
		    CASE "Giro"."moneda"
			    WHEN '1' THEN ("Giro"."importe"):: DECIMAL(10, 3) ELSE (0.00):: DECIMAL(10, 3) END AS "importe_soles",
		    coalesce("Giro"."comision_dt",0):: DECIMAL(10, 3),
		    coalesce("Giro"."gastos_administrativos",0)::DECIMAL(10,3),
	      	COALESCE( "Giro"."comision_banco",(0.00):: DECIMAL(10, 3)) as "comision_banco",
		    "Giro".st_estado, "Giro".solicitud_obs, "Giro".st_autorizada, "Giro".anulacion_motivo 
        from public.operacion_caja OCaj Inner join public.transferencia as "Giro" 
          ON (Ocaj.documento_codigo = "Giro"."St_documento_codigo"
            and OCaj.documento_serie = "Giro"."St_documento_serie"
            and OCaj.nro_operacion = "Giro"."nro_Solicitud")
          inner join oficina on "Giro"."oficina_codigo_destino"="oficina"."oficina_codigo"
        where
        	caja_codigo=in_caja_codigo 
		    and (CASE WHEN nombre_beneficiario = '*' THEN TRUE 
              ELSE "Giro"."beneficiario_razon_social" ilike ('%' ||nombre_beneficiario|| '%') END)
		    and (CASE WHEN nombre_solicitante = '*' THEN TRUE 
              ELSE "Giro"."solicitante_razon_social" ilike ('%' ||nombre_solicitante|| '%') END)
        	and (case when opcion_fecha != 0 then "Giro"."op_fecha_hora" 
					BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
					AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') 
				else (
					"Giro"."solicitud_fecha_hora" 
						BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
						AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') 
					AND CASE when estado = 5 then "Giro".st_estado in (1,2) 
						WHEN estado != 0 THEN "Giro".st_estado = estado 							
					else TRUE END
			)END);
	END;
  $BODY$;

DROP FUNCTION IF EXISTS recaudadosOficina1;
CREATE OR REPLACE FUNCTION recaudadosOficina1(
  IN in_oficina_codigo character varying DEFAULT '*',
	IN nombre_beneficiario VARCHAR(100) DEFAULT '*',
	IN nombre_solicitante VARCHAR(100) DEFAULT '*',
	IN opcion_fecha integer DEFAULT 0,
	IN estado integer DEFAULT 0,
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
	fecha_hora TIMESTAMP WITH TIME ZONE,
    importe_soles DECIMAL(10, 3),
    comision_dt DECIMAL(10, 3),
    gastos_administrativos DECIMAL(10, 3),
    comision_banco DECIMAL(10, 3),
    st_estado integer,
	  solicitud_obs VARCHAR(500),
	  st_autorizada integer,
	anulacion_motivo varchar
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN
      RETURN QUERY
        select row_number() OVER (ORDER BY "Giro"."St_documento_codigo","Giro"."St_documento_serie","Giro"."nro_Solicitud" ASC, 
								  "Giro"."solicitud_fecha_hora" ASC) "nro",
		    OfOrigen.oficina_nombre, OfDestino.oficina_nombre,
        ("Giro"."St_documento_codigo"||"Giro"."St_documento_serie"||'-'||"Giro"."nro_Solicitud") as nro_operacion,"Giro".beneficiario_razon_social,
        "Giro".solicitante_razon_social,"Giro".solicitud_fecha_hora, 
		case "Giro".st_estado when 2 then "Giro"."op_fecha_hora"
							when 3 then "Giro".anulacion_fecha_hora
							when 4 then "Giro".anulacion_fecha_hora end,
		    CASE "Giro"."moneda"
			    WHEN '1' THEN ("Giro"."importe"):: DECIMAL(10, 3) ELSE (0.00):: DECIMAL(10, 3) END AS "importe_soles",
		      coalesce("Giro"."comision_dt",0):: DECIMAL(10, 3), 
			  coalesce("Giro"."gastos_administrativos",0):: DECIMAL(10, 3),
		      COALESCE( "Giro"."comision_banco",(0.00):: DECIMAL(10, 3)) as "comision_banco",
		    "Giro".st_estado, "Giro".solicitud_obs, "Giro".st_autorizada, "Giro".anulacion_motivo  
        from public.transferencia as "Giro" 
        inner join oficina OfOrigen on "Giro"."oficina_codigo_origen"=OfOrigen."oficina_codigo" 
		    inner join oficina OfDestino on "Giro"."oficina_codigo_destino"=OfDestino."oficina_codigo" 
        where
        	(CASE WHEN in_oficina_codigo != '*' then oficina_codigo_origen=in_oficina_codigo else true end)
		    and (CASE WHEN nombre_beneficiario = '*' THEN TRUE 
              ELSE "Giro"."beneficiario_razon_social" ilike ('%' ||nombre_beneficiario|| '%') END)
		    and (CASE WHEN nombre_solicitante = '*' THEN TRUE 
              ELSE "Giro"."solicitante_razon_social" ilike ('%' ||nombre_solicitante|| '%') END)
        	and (case when opcion_fecha != 0 then "Giro"."op_fecha_hora" 
					BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
					AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') 
				else (
					"Giro"."solicitud_fecha_hora" 
						BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
						AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') 
					AND CASE when estado = 5 then "Giro".st_estado in (1,2) 
						WHEN estado != 0 THEN "Giro".st_estado = estado 							
					else TRUE END
			)END);
	  END;
  $BODY$;

DROP FUNCTION IF EXISTS recaudadosEmpresa1;
CREATE OR REPLACE FUNCTION recaudadosEmpresa1(
  IN in_empresa_codigo character varying DEFAULT '*',
	IN nombre_beneficiario VARCHAR(100) DEFAULT '*',
	IN nombre_solicitante VARCHAR(100) DEFAULT '*',
	IN opcion_fecha integer DEFAULT 0,
	IN estado integer DEFAULT 0,
  IN fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE,
  IN fecha_final TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE
  )
  RETURNS TABLE (
	  nro BIGINT ,
    oficinaDestino VARCHAR(20),
    "nro_Solicitud" text,
    beneficiario_razon_social VARCHAR(100),
    solicitante_razon_social VARCHAR(100),
    solicitud_fecha_hora TIMESTAMP WITH TIME ZONE,
	fecha_hora TIMESTAMP WITH TIME ZONE,
    importe_soles DECIMAL(10, 3),
    comision_dt DECIMAL(10, 3),
    gastos_administrativos DECIMAL(10, 3),
    comision_banco DECIMAL(10, 3),
    st_estado integer,
    solicitud_obs VARCHAR(500),
    st_autorizada integer,
	anulacion_motivo varchar
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN
      RETURN QUERY
        select row_number() OVER (ORDER BY "Giro"."St_documento_codigo","Giro"."St_documento_serie","Giro"."nro_Solicitud" ASC, 
								  "Giro"."solicitud_fecha_hora" ASC) "nro",
		    "oficina".oficina_nombre,("Giro"."St_documento_codigo"||"Giro"."St_documento_serie"||'-'||"Giro"."nro_Solicitud") as nro_operacion,"Giro".beneficiario_razon_social,
        "Giro".solicitante_razon_social,"Giro".solicitud_fecha_hora, 
		case "Giro".st_estado when 2 then "Giro"."op_fecha_hora"
							when 3 then "Giro".anulacion_fecha_hora
							when 4 then "Giro".anulacion_fecha_hora end,
		    CASE "Giro"."moneda"
			    WHEN '1' THEN ("Giro"."importe"):: DECIMAL(10, 3) ELSE (0.00):: DECIMAL(10, 3) END AS "importe_soles",
		      coalesce("Giro"."comision_dt",0):: DECIMAL(10, 3),
			  coalesce("Giro"."gastos_administrativos",0)::DECIMAL(10,3),
		      COALESCE( "Giro"."comision_banco",(0.00):: DECIMAL(10, 3)) as "comision_banco",
		    "Giro".st_estado, "Giro".solicitud_obs, "Giro".st_autorizada, "Giro".anulacion_motivo   
        from public.transferencia as "Giro" 
        inner join oficina on "Giro"."oficina_codigo_destino"="oficina"."oficina_codigo"
        where
		    "Giro".oficina_codigo_origen in (select oficina_codigo
								from public.oficina
								where  empresa_codigo=in_empresa_codigo ) 		    
		   	and (CASE WHEN nombre_beneficiario = '*' THEN TRUE 
              ELSE "Giro"."beneficiario_razon_social" ilike ('%' ||nombre_beneficiario|| '%') END)
		    and (CASE WHEN nombre_solicitante = '*' THEN TRUE 
              ELSE "Giro"."solicitante_razon_social" ilike ('%' ||nombre_solicitante|| '%') END)
        	and (case when opcion_fecha != 0 then "Giro"."op_fecha_hora" 
					BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
					AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') 
				else (
					"Giro"."solicitud_fecha_hora" 
						BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
						AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') 
					AND CASE when estado = 5 then "Giro".st_estado in (1,2) 
						WHEN estado != 0 THEN "Giro".st_estado = estado 							
					else TRUE END
			)END);
  	END;
$BODY$;