DROP FUNCTION IF EXISTS banco_afiliados;
CREATE OR REPLACE FUNCTION banco_afiliados(
    IN id_banco character varying DEFAULT '*',
	IN oficina_origen VARCHAR(12) DEFAULT '*',
	IN estado integer DEFAULT 0,
    IN fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE,
    IN fecha_fin TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE
  )
  RETURNS TABLE (    
    documento_codigo VARCHAR(10),
	documento_serie INTEGER,
    "nro_Solicitud" INTEGER,
	entidad_nombre VARCHAR(60) ,
    beneficiario_razon_social VARCHAR(100),
	importe_soles DECIMAL(7, 2),
	comision_banco DECIMAL(7, 3),	
	deposito_tipo VARCHAR(20),
	deposito_destino VARCHAR(30),
	nro_cuenta VARCHAR(30),
	observacion VARCHAR(200),
	fecha_solicitud TIMESTAMP WITH TIME ZONE,
	fecha_anulacion TIMESTAMP WITH TIME ZONE,
	fecha_pagado TIMESTAMP WITH TIME ZONE,
	op_documento_codigo VARCHAR(10),
	op_documento_serie INTEGER,
	op_nro_operacion INTEGER,
    st_estado integer,
	foto boolean
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN
      RETURN QUERY
		select "Trans"."St_documento_codigo", "Trans"."St_documento_serie", "Trans"."nro_Solicitud", "EntF"."entidad_razon_social", 
				"Trans"."beneficiario_razon_social", "Trans"."importe", "Trans"."comision_banco", 
				"Trans"."deposito_tipo", "Trans"."deposito_destino", "Trans"."deposito_nro_cuenta", 
				"Trans"."solicitud_obs", "Trans".solicitud_fecha_hora, "Trans".anulacion_fecha_hora, "Trans".op_fecha_hora, 
				"Trans".op_documento_codigo, "Trans".op_documento_serie, "Trans".op_nro_operacion,
				"Trans"."st_estado","Trans".foto
		from transferencia "Trans" 
		inner join entidad_financiera_servicios "EntF" on "Trans"."deposito_entidad_codigo"="EntF"."entidad_codigo" 
		where (CASE WHEN id_banco != '*' THEN "Trans"."deposito_entidad_codigo" = id_banco ELSE TRUE END) 
		and "Trans"."oficina_codigo_destino" = 'OFP006' 
		AND "Trans"."oficina_codigo_origen" = oficina_origen 
		AND (CASE WHEN estado != 0 THEN "Trans"."st_estado"=estado else true end) and 
		tipo_giro= 'Banco' and "Trans"."solicitud_fecha_hora" 
			between ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
			AND ((DATE(fecha_fin) + time '23:59:59')AT TIME ZONE 'PET')
		order by "Trans".solicitud_fecha_hora, "EntF"."entidad_razon_social","nro_Solicitud";
	END;
  $BODY$;