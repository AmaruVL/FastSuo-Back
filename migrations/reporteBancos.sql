DROP FUNCTION IF EXISTS bancosRepor;
CREATE OR REPLACE FUNCTION bancosRepor(
    IN id_banco character varying DEFAULT '*',
	IN oficina_origen VARCHAR(12) DEFAULT '*',
	IN in_usuario CHARACTER VARYING DEFAULT '*',
	IN opcion integer DEFAULT 0,
	IN estado integer DEFAULT 0,
	IN tipo VARCHAR(20) DEFAULT '*',
    IN fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE,
    IN fecha_fin TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE
  )
  RETURNS TABLE (
    entidad_nombre VARCHAR(60) ,
    oficinaOrigen VARCHAR(20),
    "nro_Solicitud" INTEGER,
    beneficiario_razon_social VARCHAR(100),
	moneda VARCHAR(5),
	importe DECIMAL(10, 3),
	comision_banco DECIMAL(10, 3),	
	deposito_tipo VARCHAR(20),
	deposito_destino VARCHAR(30),
	importe_pagado DECIMAL(10,3),
	nro_cuenta VARCHAR(30),
	observacion VARCHAR(200),
    st_estado integer,
	op_usuario VARCHAR(50),
	fecha_solicitud TIMESTAMP WITH TIME ZONE,
	fecha_pagado TIMESTAMP WITH TIME ZONE
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN
      RETURN QUERY
		select "EntF"."entidad_razon_social", "oficina"."oficina_nombre", 
		"Trans"."nro_Solicitud", "Trans"."beneficiario_razon_social", "Trans"."moneda","Trans"."importe", "Trans"."comision_banco", 
		"Trans"."deposito_tipo", "Trans"."deposito_destino", coalesce("Trans".importe_pagado,0), "Trans"."deposito_nro_cuenta", 
		"Trans"."solicitud_obs", "Trans"."st_estado", "Trans".op_usuario, "Trans".solicitud_fecha_hora, "Trans".op_fecha_hora 
		from transferencia "Trans" 
		inner join oficina on "Trans"."oficina_codigo_origen"="oficina"."oficina_codigo" 
		inner join entidad_financiera_servicios "EntF" on "Trans"."deposito_entidad_codigo"="EntF"."entidad_codigo" 
		where (CASE WHEN id_banco != '*' THEN "Trans"."deposito_entidad_codigo" = id_banco ELSE TRUE END) 
		and "Trans"."oficina_codigo_destino" = 'OFP006' 
		AND (CASE WHEN oficina_origen != '*' THEN "Trans"."oficina_codigo_origen" = oficina_origen ELSE TRUE END)
		AND (CASE WHEN in_usuario != '*' THEN "Trans".op_usuario = in_usuario ELSE TRUE END)
		and tipo_giro= 'Banco' 
		and (case when tipo != '*' then "Trans".deposito_tipo = tipo else true end) 
		and (case when opcion != 0 then "Trans"."op_fecha_hora" 
					BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
					AND ((DATE(fecha_fin) + time '23:59:59')AT TIME ZONE 'PET') 
				else (
					"Trans"."solicitud_fecha_hora" 
						BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
						AND ((DATE(fecha_fin) + time '23:59:59')AT TIME ZONE 'PET') 
					AND CASE WHEN estado != 0 THEN "Trans".st_estado = estado else TRUE END)
		END)
		order by "EntF"."entidad_razon_social","nro_Solicitud";
	END;
  $BODY$;