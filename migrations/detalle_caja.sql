DROP FUNCTION IF EXISTS giros;
CREATE OR REPLACE FUNCTION giros(
    IN in_caja_codigo character varying,
    IN modulo character varying,
    IN fecha_inicio date,
    IN fecha_final date
  )
  RETURNS TABLE (
	nro BIGINT ,
    "oficina_nombre" VARCHAR(20),
    "nro_Solicitud" text,
    beneficiario_razon_social VARCHAR(100),
    solicitante_razon_social VARCHAR(100),
    importe_soles DECIMAL(10, 3),
    importe_dolares DECIMAL(10, 3),
    st_estado INTEGER,
	usuario VARCHAR(20),
	fecha_hora_operacion TIMESTAMP WITH TIME ZONE
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN
      RETURN QUERY
        select row_number() OVER (ORDER BY OCaj.documento_codigo,OCaj.documento_serie,OCaj.nro_operacion ASC, 
				"Giro"."solicitud_fecha_hora" ASC) "nro",
			"oficina".oficina_nombre,(OCaj.documento_codigo||OCaj.documento_serie||'-'||OCaj.nro_operacion) as nro_operacion,
	    	"Giro".beneficiario_razon_social,"Giro".solicitante_razon_social,OCaj."moneda1_Ingre", 
		    OCaj."moneda2_Ingre", "Giro".st_estado, 
			OCaj.usuario, OCaj.fecha_hora_operacion 
        from public.operacion_caja OCaj Inner join public.transferencia as "Giro" 
          ON (Ocaj.documento_codigo = "Giro"."St_documento_codigo"
            and OCaj.documento_serie = "Giro"."St_documento_serie"
            and OCaj.nro_operacion = "Giro"."nro_Solicitud")
          inner join oficina on "Giro"."oficina_codigo_destino"="oficina"."oficina_codigo"
        where
        caja_codigo=in_caja_codigo
        and fecha_trabajo between fecha_inicio and fecha_final 
		order by OCaj.documento_codigo,OCaj.documento_serie,OCaj.nro_operacion;
	END;
  $BODY$;
  
DROP FUNCTION IF EXISTS orden_pago;
CREATE OR REPLACE FUNCTION orden_pago(
    IN in_caja_codigo character varying,
    IN modulo character varying,
    IN fecha_inicio date,
    IN fecha_final date
  )
  RETURNS TABLE (
	nro BIGINT ,
    "oficina_nombre" VARCHAR(20),
    "nro_Solicitud" text,
    beneficiario_razon_social VARCHAR(100),
    solicitante_razon_social VARCHAR(100),
	importe_soles DECIMAL(10, 3),
	importe_dolares DECIMAL(10, 3),
	st_estado INTEGER,
	usuario VARCHAR(20),
	fecha_hora_operacion TIMESTAMP WITH TIME ZONE
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN
      RETURN QUERY
        select row_number() OVER (ORDER BY OCaj.documento_codigo,OCaj.documento_serie,OCaj.nro_operacion ASC, 
				"Giro"."solicitud_fecha_hora" ASC) "nro",
		"oficina".oficina_nombre,(OCaj.documento_codigo||OCaj.documento_serie||'-'||OCaj.nro_operacion) as nro_operacion,
		"Giro".beneficiario_razon_social,"Giro".solicitante_razon_social,OCaj."moneda1_Egre", 
		OCaj."moneda2_Egre", "Giro".st_estado, 
		OCaj.usuario, OCaj.fecha_hora_operacion 
        from public.operacion_caja OCaj Inner join public.transferencia as "Giro" 
          ON (Ocaj.documento_codigo = "Giro"."op_documento_codigo"
            and OCaj.documento_serie = "Giro"."op_documento_serie"
            and OCaj.nro_operacion = "Giro"."op_nro_operacion")
          inner join oficina on "Giro"."oficina_codigo_origen"="oficina"."oficina_codigo"
        where
        caja_codigo=in_caja_codigo
        and "Giro".op_fecha_hora BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
        AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') 
        and "Giro".st_estado=2 order by OCaj.documento_codigo,OCaj.documento_serie,OCaj.nro_operacion;
	END;
  $BODY$;

DROP FUNCTION IF EXISTS recibos2;
CREATE OR REPLACE FUNCTION recibos2(
    IN in_caja_codigo character varying,
  	IN modulo character varying,
    IN fecha_inicio timestamp with time zone,
    IN fecha_final timestamp with time zone
  )
  RETURNS TABLE (
	nro BIGINT ,
    "documento_codigo" VARCHAR(4),
    "nro_operacion" text,
	oficina_nombre VARCHAR(50),
	concepto text,
    cliente_razon_social VARCHAR(100),	
    moneda1_Ingre DECIMAL(10, 3),
    moneda1_Egre DECIMAL(10, 3),
    moneda2_Ingre DECIMAL(10, 3),
    moneda2_Egre DECIMAL(10, 3),
	usuario VARCHAR(20),
	fecha_hora_operacion TIMESTAMP WITH TIME ZONE
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN
      RETURN QUERY
        select row_number() OVER (ORDER BY OCaj.documento_codigo,OCaj.documento_serie,OCaj.nro_operacion ASC, 
				OCaj."fecha_hora_operacion" ASC) "nro",
		OCaj.documento_codigo, (OCaj.documento_serie||'-'||OCaj.nro_operacion) as nro_operacion, 
		(case when OCaj.documento_codigo='HE-' then OfHab.oficina_nombre else OfCaj.oficina_nombre end) as oficina_nombre,
		    (COALESCE(OCaj.concepto,'')||' '||COALESCE(Rec.recibo_concepto,'')) as concepto, OCaj.cliente_razon_social,
        OCaj."moneda1_Ingre", OCaj."moneda1_Egre", OCaj."moneda2_Ingre",OCaj."moneda2_Egre",
		OCaj.usuario, OCaj.fecha_hora_operacion 
        from public.operacion_caja OCaj 
		left join recibo_interno Rec on (OCaj.documento_codigo=Rec.recibo_doc_codigo and 
										 OCaj.documento_serie = Rec.recibo_doc_serie and 
										 OCaj.nro_operacion = Rec.recibo_nro)		
		left join habilitacion Hab on ((OCaj.documento_codigo=Hab.origen_docu_codigo and
									  OCaj.documento_serie=Hab.origen_docu_serie and
									  OCaj.nro_operacion=Hab.origen_nro_operacion)or
									  (OCaj.documento_codigo=Hab.destino_documento_codigo and
									   OCaj.documento_serie=Hab.destino_documento_serie and
									   OCaj.nro_operacion=Hab.destino_nro_operacion))
        left join oficina OfHab on (OfHab.oficina_codigo=Hab.origen_oficina_codigo)
		left join oficina OfCaj on (OfCaj.oficina_codigo=OCaj.oficina_origen_codigo)
        where caja_codigo=in_caja_codigo 
        and OCaj.fecha_hora_operacion BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
        AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET')   
        and OCaj.modulo not in ('Transferencia','Op','Intercambio','Banco','Servicios','Egreso Servicios') 
		order by OCaj.documento_codigo,OCaj.documento_serie,OCaj.nro_operacion;
	END;
$BODY$;

DROP FUNCTION IF EXISTS servicios_caja;
CREATE OR REPLACE FUNCTION servicios_caja(
    IN in_caja_codigo character varying,
    IN fecha_inicio timestamp with time zone,
    IN fecha_final timestamp with time zone
  )
  RETURNS TABLE (
	nro BIGINT ,
    "documento_codigo" VARCHAR(5),
    "nro_operacion" text,
	oficina_nombre VARCHAR(50),
	entidad_razon_social VARCHAR(50),
    cliente_razon_social VARCHAR(100),	
    moneda1_Ingre DECIMAL(10, 3),
    moneda1_Egre DECIMAL(10, 3),
    moneda2_Ingre DECIMAL(10, 3),
    moneda2_Egre DECIMAL(10, 3),
	usuario VARCHAR(20),
	fecha_hora_operacion TIMESTAMP WITH TIME ZONE
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN
      RETURN QUERY
		select row_number() OVER (ORDER BY OCaj.documento_codigo,OCaj.documento_serie,OCaj.nro_operacion ASC, 
				OCaj."fecha_hora_operacion" ASC) "nro",
		OCaj.documento_codigo,(OCaj.documento_serie||'-'||OCaj.nro_operacion) as nro_operacion,
		OfCaj.oficina_nombre as oficina_nombre, Ent.entidad_razon_social, OCta.razon_social,
        OCaj."moneda1_Ingre", OCaj."moneda1_Egre", OCaj."moneda2_Ingre",OCaj."moneda2_Egre", 
		OCaj.usuario, OCaj.fecha_hora_operacion 
        from public.operacion_caja OCaj 
		right outer join operacion_cuenta OCta on (OCaj.documento_codigo=OCta.documento_codigo and 
										 OCaj.documento_serie = OCta.documento_serie and 
										 OCaj.nro_operacion = OCta.nro_operacion)
		left outer join oficina OfCaj on (OfCaj.oficina_codigo=OCaj.oficina_origen_codigo)
		left outer join entidad_financiera_servicios Ent on (OCta.entidad_codigo = Ent.entidad_codigo)
		where caja_codigo=in_caja_codigo  
        and OCaj.fecha_hora_operacion BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
        AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') 
		and OCaj.modulo in ('Servicios','Egreso Servicios') 
		order by OCaj.documento_codigo,OCaj.documento_serie,OCaj.nro_operacion;
		END;
$BODY$;

---OFICINA----
DROP FUNCTION IF EXISTS giros_oficina;
CREATE OR REPLACE FUNCTION giros_oficina(
    IN in_oficina_codigo character varying,
    IN modulo character varying,
    IN fecha_inicio date,
    IN fecha_final date
  )
  RETURNS TABLE (
	nro BIGINT ,
    "oficina_nombre" VARCHAR(20),
    "nro_Solicitud" text,
    beneficiario_razon_social VARCHAR(100),
    solicitante_razon_social VARCHAR(100),
	importe_soles DECIMAL(10, 3),
	importe_dolares DECIMAL(10, 3),
	st_estado INTEGER,
	usuario VARCHAR(20),
	fecha_hora_operacion TIMESTAMP WITH TIME ZONE
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN
      RETURN QUERY
		select row_number() OVER (ORDER BY OCaj.documento_codigo,OCaj.documento_serie,OCaj.nro_operacion ASC, 
				"Giro"."solicitud_fecha_hora" ASC) "nro",
		"oficina".oficina_nombre,(OCaj.documento_codigo||OCaj.documento_serie||'-'||OCaj.nro_operacion) as nro_operacion,"Giro".beneficiario_razon_social,
		"Giro".solicitante_razon_social,OCaj."moneda1_Ingre", OCaj."moneda2_Ingre", "Giro".st_estado,
		OCaj.usuario, OCaj.fecha_hora_operacion 
		from public.operacion_caja OCaj Inner join public.transferencia as "Giro" 
			ON (Ocaj.documento_codigo = "Giro"."St_documento_codigo"
				and OCaj.documento_serie = "Giro"."St_documento_serie"
				and OCaj.nro_operacion = "Giro"."nro_Solicitud")
			inner join oficina on "Giro"."oficina_codigo_destino"="oficina"."oficina_codigo"
		where
		oficina_origen_codigo=in_oficina_codigo
		and fecha_trabajo between fecha_inicio and fecha_final 
		order by OCaj.documento_codigo,OCaj.documento_serie,OCaj.nro_operacion;
	END;
  $BODY$;

DROP FUNCTION IF EXISTS orden_pago_oficina;
CREATE OR REPLACE FUNCTION orden_pago_oficina(
    IN in_oficina_codigo character varying,
    IN modulo character varying,
    IN fecha_inicio date,
    IN fecha_final date
  )
  RETURNS TABLE (
	nro BIGINT ,
    "oficina_nombre" VARCHAR(20),
    "nro_Solicitud" text,
    beneficiario_razon_social VARCHAR(100),
    solicitante_razon_social VARCHAR(100),
    importe_soles DECIMAL(10, 3),
    importe_dolares DECIMAL(10, 3),
    st_estado INTEGER,
	usuario VARCHAR(20),
	fecha_hora_operacion TIMESTAMP WITH TIME ZONE
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN
      RETURN QUERY
		select row_number() OVER (ORDER BY OCaj.documento_codigo,OCaj.documento_serie,OCaj.nro_operacion ASC, 
				"Giro"."solicitud_fecha_hora" ASC) "nro",
		"oficina".oficina_nombre,(OCaj.documento_codigo||OCaj.documento_serie||'-'||OCaj.nro_operacion) as nro_operacion,"Giro".beneficiario_razon_social,
		"Giro".solicitante_razon_social,OCaj."moneda1_Egre", OCaj."moneda2_Egre", "Giro".st_estado, 
		OCaj.usuario, OCaj.fecha_hora_operacion 
		from public.operacion_caja OCaj Inner join public.transferencia as "Giro" 
			ON (Ocaj.documento_codigo = "Giro"."op_documento_codigo"
				and OCaj.documento_serie = "Giro"."op_documento_serie"
				and OCaj.nro_operacion = "Giro"."op_nro_operacion")
			inner join oficina on "Giro"."oficina_codigo_origen"="oficina"."oficina_codigo"
		where
		oficina_origen_codigo=in_oficina_codigo
		and "Giro".op_fecha_hora BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
        AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') 
    and "Giro".st_estado=2 order by OCaj.documento_codigo,OCaj.documento_serie,OCaj.nro_operacion;
	END;
  $BODY$;

DROP FUNCTION IF EXISTS recibos_oficina2;
CREATE OR REPLACE FUNCTION recibos_oficina2(
    IN in_oficina_codigo character varying,
	IN modulo character varying,
    IN fecha_inicio timestamp with time zone,
    IN fecha_final timestamp with time zone
  )
  RETURNS TABLE (
	nro BIGINT ,
    "documento_codigo" VARCHAR(5),
    "nro_operacion" text,
	oficina_nombre VARCHAR(50),
	concepto text,
    cliente_razon_social VARCHAR(100),	
    moneda1_Ingre DECIMAL(10, 3),
    moneda1_Egre DECIMAL(10, 3),
    moneda2_Ingre DECIMAL(10, 3),
    moneda2_Egre DECIMAL(10, 3),
	usuario VARCHAR(20),
	fecha_hora_operacion TIMESTAMP WITH TIME ZONE
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN
      RETURN QUERY
		select row_number() OVER (ORDER BY OCaj.documento_codigo,OCaj.documento_serie,OCaj.nro_operacion ASC, 
				OCaj."fecha_hora_operacion" ASC) "nro",
		OCaj.documento_codigo,(OCaj.documento_serie||'-'||OCaj.nro_operacion) as nro_operacion,
		(case when OCaj.documento_codigo='HE-' then OfHab.oficina_nombre else OfCaj.oficina_nombre end) as oficina_nombre,
		    (COALESCE(OCaj.concepto,'')||' '||COALESCE(Rec.recibo_concepto,'')) as concepto, OCaj.cliente_razon_social,
        OCaj."moneda1_Ingre", OCaj."moneda1_Egre", OCaj."moneda2_Ingre",OCaj."moneda2_Egre", 
		OCaj.usuario, OCaj.fecha_hora_operacion 
        from public.operacion_caja OCaj 
		left join recibo_interno Rec on (OCaj.documento_codigo=Rec.recibo_doc_codigo and 
										 OCaj.documento_serie = Rec.recibo_doc_serie and 
										 OCaj.nro_operacion = Rec.recibo_nro)
		left join habilitacion Hab on ((OCaj.documento_codigo=Hab.origen_docu_codigo and
									  OCaj.documento_serie=Hab.origen_docu_serie and
									  OCaj.nro_operacion=Hab.origen_nro_operacion)or
									  (OCaj.documento_codigo=Hab.destino_documento_codigo and
									   OCaj.documento_serie=Hab.destino_documento_serie and
									   OCaj.nro_operacion=Hab.destino_nro_operacion))
        left join oficina OfHab on (OfHab.oficina_codigo=Hab.origen_oficina_codigo)
		left join oficina OfCaj on (OfCaj.oficina_codigo=OCaj.oficina_origen_codigo)
		where oficina_origen_codigo=in_oficina_codigo 
        and OCaj.fecha_hora_operacion BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
        AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET')   
        and OCaj.modulo not in ('Transferencia','Op','Intercambio','Banco','Servicios','Egreso Servicios') 
		order by OCaj.documento_codigo,OCaj.documento_serie,OCaj.nro_operacion;
		END;
$BODY$;
DROP FUNCTION IF EXISTS servicios_oficina;
CREATE OR REPLACE FUNCTION servicios_oficina(
    IN in_oficina_codigo character varying,
    IN fecha_inicio timestamp with time zone,
    IN fecha_final timestamp with time zone
  )
  RETURNS TABLE (
	nro BIGINT ,
    "documento_codigo" VARCHAR(5),
    "nro_operacion" text,
	oficina_nombre VARCHAR(50),
	entidad_razon_social VARCHAR(50),
    cliente_razon_social VARCHAR(100),	
    moneda1_Ingre DECIMAL(10, 3),
    moneda1_Egre DECIMAL(10, 3),
    moneda2_Ingre DECIMAL(10, 3),
    moneda2_Egre DECIMAL(10, 3),
	usuario VARCHAR(20),
	fecha_hora_operacion TIMESTAMP WITH TIME ZONE
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN
      RETURN QUERY
		select row_number() OVER (ORDER BY OCaj.documento_codigo,OCaj.documento_serie,OCaj.nro_operacion ASC, 
				OCaj."fecha_hora_operacion" ASC) "nro",
		OCaj.documento_codigo,(OCaj.documento_serie||'-'||OCaj.nro_operacion) as nro_operacion,
		OfCaj.oficina_nombre as oficina_nombre, Ent.entidad_razon_social, OCta.razon_social,
        OCaj."moneda1_Ingre", OCaj."moneda1_Egre", OCaj."moneda2_Ingre",OCaj."moneda2_Egre", 
		OCaj.usuario, OCaj.fecha_hora_operacion 
        from public.operacion_caja OCaj 
		right outer join operacion_cuenta OCta on (OCaj.documento_codigo=OCta.documento_codigo and 
										 OCaj.documento_serie = OCta.documento_serie and 
										 OCaj.nro_operacion = OCta.nro_operacion)
		left outer join oficina OfCaj on (OfCaj.oficina_codigo=OCaj.oficina_origen_codigo)
		left outer join entidad_financiera_servicios Ent on (OCta.entidad_codigo = Ent.entidad_codigo)
		where oficina_origen_codigo = in_oficina_codigo 
        and OCaj.fecha_hora_operacion BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
        AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') 
		and OCaj.modulo in ('Servicios','Egreso Servicios') 
		order by OCaj.documento_codigo,OCaj.documento_serie,OCaj.nro_operacion;
		END;
$BODY$;

---EMPRESA------
DROP FUNCTION IF EXISTS giros_empresa;
CREATE OR REPLACE FUNCTION giros_empresa(
    IN in_empresa_codigo character varying,
    IN modulo character varying,
    IN fecha_inicio date,
    IN fecha_final date
  )
  RETURNS TABLE (
	  nro BIGINT ,
    "oficina_nombre" VARCHAR(20),
    "nro_Solicitud" text,
    beneficiario_razon_social VARCHAR(100),
    solicitante_razon_social VARCHAR(100),
	importe_soles DECIMAL(10, 3),
	importe_dolares DECIMAL(10, 3),
	st_estado INTEGER,
	usuario VARCHAR(20),
	fecha_hora_operacion TIMESTAMP WITH TIME ZONE
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN
      RETURN QUERY
		select row_number() OVER (ORDER BY OCaj.documento_codigo,OCaj.documento_serie,OCaj.nro_operacion ASC, 
				"Giro"."solicitud_fecha_hora" ASC) "nro",
		"oficina".oficina_nombre,(OCaj.documento_codigo||OCaj.documento_serie||'-'||OCaj.nro_operacion) as nro_operacion,"Giro".beneficiario_razon_social,
		"Giro".solicitante_razon_social,OCaj."moneda1_Ingre", OCaj."moneda2_Ingre", "Giro".st_estado, 
		OCaj.usuario, OCaj.fecha_hora_operacion 
		from public.operacion_caja OCaj Inner join public.transferencia as "Giro" 
			ON (Ocaj.documento_codigo = "Giro"."St_documento_codigo"
				and OCaj.documento_serie = "Giro"."St_documento_serie"
				and OCaj.nro_operacion = "Giro"."nro_Solicitud")
			inner join oficina on "Giro"."oficina_codigo_destino"="oficina"."oficina_codigo"
		where
		oficina_origen_codigo in (select oficina_codigo
								from public.oficina
								where  empresa_codigo=in_empresa_codigo )						  
		and fecha_trabajo between fecha_inicio and fecha_final 
		order by OCaj.documento_codigo,OCaj.documento_serie,OCaj.nro_operacion;
	END;
  $BODY$;

DROP FUNCTION IF EXISTS orden_pago_empresa;
CREATE OR REPLACE FUNCTION orden_pago_empresa(
    IN in_empresa_codigo character varying,
    IN modulo character varying,
    IN fecha_inicio date,
    IN fecha_final date
  )
  RETURNS TABLE (
	nro BIGINT ,
    "oficina_nombre" VARCHAR(20),
    "nro_Solicitud" text,
    beneficiario_razon_social VARCHAR(100),
    solicitante_razon_social VARCHAR(100),
	importe_soles DECIMAL(10, 3),
	importe_dolares DECIMAL(10, 3),
	st_estado INTEGER,
	usuario VARCHAR(20),
	fecha_hora_operacion TIMESTAMP WITH TIME ZONE
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN
      RETURN QUERY
		select row_number() OVER (ORDER BY OCaj.documento_codigo,OCaj.documento_serie,OCaj.nro_operacion ASC, 
				"Giro"."solicitud_fecha_hora" ASC) "nro",
		"oficina".oficina_nombre,(OCaj.documento_codigo||OCaj.documento_serie||'-'||OCaj.nro_operacion) as nro_operacion,"Giro".beneficiario_razon_social,
		"Giro".solicitante_razon_social,OCaj."moneda1_Egre", OCaj."moneda2_Egre", "Giro".st_estado, 
		OCaj.usuario, OCaj.fecha_hora_operacion 
		from public.operacion_caja OCaj Inner join public.transferencia as "Giro" 
			ON (Ocaj.documento_codigo = "Giro"."op_documento_codigo"
				and OCaj.documento_serie = "Giro"."op_documento_serie"
				and OCaj.nro_operacion = "Giro"."op_nro_operacion")
			inner join oficina on "Giro"."oficina_codigo_origen"="oficina"."oficina_codigo"
		where
		oficina_origen_codigo in (select oficina_codigo
								from public.oficina
								where  empresa_codigo=in_empresa_codigo )						  
		and "Giro".op_fecha_hora BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
        AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') 
    and "Giro".st_estado=2 order by OCaj.documento_codigo,OCaj.documento_serie,OCaj.nro_operacion;
	END;
  $BODY$;

DROP FUNCTION IF EXISTS recibos_empresa2;
CREATE OR REPLACE FUNCTION recibos_empresa2(
    IN in_empresa_codigo character varying,
	IN modulo character varying,
    IN fecha_inicio timestamp with time zone,
    IN fecha_final timestamp with time zone
  )
  RETURNS TABLE (
	 nro BIGINT ,
    "documento_codigo" VARCHAR(5),
    "nro_operacion" text,
	oficina_nombre VARCHAR(50),
	concepto text,
    cliente_razon_social VARCHAR(100),	
    moneda1_Ingre DECIMAL(10, 3),
    moneda1_Egre DECIMAL(10, 3),
    moneda2_Ingre DECIMAL(10, 3),
    moneda2_Egre DECIMAL(10, 3),
	usuario VARCHAR(20),
	fecha_hora_operacion TIMESTAMP WITH TIME ZONE
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN
      RETURN QUERY
        select row_number() OVER (ORDER BY OCaj.documento_codigo,OCaj.documento_serie,OCaj.nro_operacion ASC, 
				OCaj."fecha_hora_operacion" ASC) "nro",
		OCaj.documento_codigo,(OCaj.documento_serie||'-'||OCaj.nro_operacion) as nro_operacion, 
		(case when OCaj.documento_codigo='HE-' then OfHab.oficina_nombre else OfCaj.oficina_nombre end) as oficina_nombre,
		(COALESCE(OCaj.concepto,'')||' '||COALESCE(Rec.recibo_concepto,'')) as concepto, OCaj.cliente_razon_social,
        OCaj."moneda1_Ingre", OCaj."moneda1_Egre", OCaj."moneda2_Ingre",OCaj."moneda2_Egre", 
		OCaj.usuario, OCaj.fecha_hora_operacion 
        from public.operacion_caja OCaj 
		left join recibo_interno Rec on (OCaj.documento_codigo=Rec.recibo_doc_codigo and 
										 OCaj.documento_serie = Rec.recibo_doc_serie and 
										 OCaj.nro_operacion = Rec.recibo_nro) 		
		left join habilitacion Hab on ((OCaj.documento_codigo=Hab.origen_docu_codigo and
									  OCaj.documento_serie=Hab.origen_docu_serie and
									  OCaj.nro_operacion=Hab.origen_nro_operacion)or
									  (OCaj.documento_codigo=Hab.destino_documento_codigo and
									   OCaj.documento_serie=Hab.destino_documento_serie and
									   OCaj.nro_operacion=Hab.destino_nro_operacion))
        left join oficina OfHab on (OfHab.oficina_codigo=Hab.origen_oficina_codigo)
		left join oficina OfCaj on (OfCaj.oficina_codigo=OCaj.oficina_origen_codigo)
        where OCaj.oficina_origen_codigo in 
          (select oficina_codigo from public.oficina where  empresa_codigo=in_empresa_codigo )
        and OCaj.fecha_hora_operacion BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
        AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET')   
        and OCaj.modulo not in ('Transferencia','Op','Intercambio','Banco','Servicios', 'Egreso Servicios') 
		order by OCaj.documento_codigo,OCaj.documento_serie,OCaj.nro_operacion;
	END;
$BODY$;
DROP FUNCTION IF EXISTS servicios_empresa;
CREATE OR REPLACE FUNCTION servicios_empresa(
    IN in_empresa_codigo character varying,
    IN fecha_inicio timestamp with time zone,
    IN fecha_final timestamp with time zone
  )
  RETURNS TABLE (
	nro BIGINT ,
    "documento_codigo" VARCHAR(5),
    "nro_operacion" text,
	oficina_nombre VARCHAR(50),
	entidad_razon_social VARCHAR(50),
    cliente_razon_social VARCHAR(100),	
    moneda1_Ingre DECIMAL(10, 3),
    moneda1_Egre DECIMAL(10, 3),
    moneda2_Ingre DECIMAL(10, 3),
    moneda2_Egre DECIMAL(10, 3),
	usuario VARCHAR(20),
	fecha_hora_operacion TIMESTAMP WITH TIME ZONE
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN
      RETURN QUERY
		select row_number() OVER (ORDER BY OCaj.documento_codigo,OCaj.documento_serie,OCaj.nro_operacion ASC, 
				OCaj."fecha_hora_operacion" ASC) "nro",
		OCaj.documento_codigo,(OCaj.documento_serie||'-'||OCaj.nro_operacion) as nro_operacion,
		OfCaj.oficina_nombre as oficina_nombre, Ent.entidad_razon_social, OCta.razon_social,
        OCaj."moneda1_Ingre", OCaj."moneda1_Egre", OCaj."moneda2_Ingre",OCaj."moneda2_Egre", 
		OCaj.usuario, OCaj.fecha_hora_operacion 
        from public.operacion_caja OCaj 
		right outer join operacion_cuenta OCta on (OCaj.documento_codigo=OCta.documento_codigo and 
										 OCaj.documento_serie = OCta.documento_serie and 
										 OCaj.nro_operacion = OCta.nro_operacion)
		left outer join oficina OfCaj on (OfCaj.oficina_codigo=OCaj.oficina_origen_codigo)
		left outer join entidad_financiera_servicios Ent on (OCta.entidad_codigo = Ent.entidad_codigo)
		where OCaj.oficina_origen_codigo in 
          (select oficina_codigo from public.oficina where  empresa_codigo=in_empresa_codigo) 
        and OCaj.fecha_hora_operacion BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
        AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') 
		and OCaj.modulo in ('Servicios','Egreso Servicios') 
		order by OCaj.documento_codigo,OCaj.documento_serie,OCaj.nro_operacion;
		END;
$BODY$;

---SALDOS CAJA
DROP FUNCTION IF EXISTS saldos_caja2;
CREATE OR REPLACE FUNCTION saldos_caja2(
    IN fecha_inicio DATE DEFAULT date(current_date),
	IN fecha_fin DATE DEFAULT date(current_date),
    IN caja_cod VARCHAR(12) DEFAULT null
  )
  RETURNS TABLE (
  soles_anterior numeric,
	dolares_anterior numeric,
	soles_final numeric,
	dolares_final numeric
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN      
      drop table if exists saldo_anterior_caja;
      CREATE TEMP TABLE saldo_anterior_caja as(
      select coalesce(sum("operacion_caja"."moneda1_Ingre" - "operacion_caja"."moneda1_Egre"),0) as soles_anterior,
          coalesce(sum("operacion_caja"."moneda2_Ingre" - "operacion_caja"."moneda2_Egre"),0) as dolares_anterior
      from operacion_caja
      where caja_codigo in 
        (select caja_codigo from caja where caja_codigo=caja_cod and estado_registro='true')
        and fecha_trabajo<fecha_inicio);

      drop table if exists saldo_final_caja;
      CREATE TEMP TABLE saldo_final_caja as(
      select coalesce(sum("operacion_caja"."moneda1_Ingre" - "operacion_caja"."moneda1_Egre"),0) as soles_final,
          coalesce(sum("operacion_caja"."moneda2_Ingre" - "operacion_caja"."moneda2_Egre"),0) as dolares_final
      from operacion_caja
      where caja_codigo in 
        (select caja_codigo from caja where caja_codigo=caja_cod and estado_registro='true')
        and fecha_trabajo<=fecha_fin);
      RETURN QUERY 
      select * from saldo_anterior_caja t1,saldo_final_caja t2;
    END;
  $BODY$;

---SALDOS OFICINA
DROP FUNCTION IF EXISTS saldos_oficina2;
CREATE OR REPLACE FUNCTION saldos_oficina2(
	IN fecha_inicio DATE DEFAULT date(current_date),
	IN fecha_fin DATE DEFAULT date(current_date),
    IN oficina_cod VARCHAR(12) DEFAULT null
)
RETURNS TABLE (
	soles_anterior numeric,
	dolares_anterior numeric,
	soles_final numeric,
	dolares_final numeric
)
LANGUAGE 'plpgsql'    
  AS $BODY$
    BEGIN      
		drop table if exists saldo_anterior_oficina;
		CREATE TEMP TABLE saldo_anterior_oficina as(
		select sum("operacion_caja"."moneda1_Ingre" - "operacion_caja"."moneda1_Egre") as soles_anterior,
				sum("operacion_caja"."moneda2_Ingre" - "operacion_caja"."moneda2_Egre") as dolares_anterior
		from operacion_caja
		where caja_codigo in 
			(select caja_codigo from caja where oficina_codigo=oficina_cod and estado_registro='true')
			and fecha_trabajo<fecha_inicio);

		drop table if exists saldo_final_oficina;
		CREATE TEMP TABLE saldo_final_oficina as(
		select sum("operacion_caja"."moneda1_Ingre" - "operacion_caja"."moneda1_Egre") as soles_final,
				sum("operacion_caja"."moneda2_Ingre" - "operacion_caja"."moneda2_Egre") as dolares_final
		from operacion_caja
		where caja_codigo in 
			(select caja_codigo from caja where oficina_codigo=oficina_cod and estado_registro='true')
			and fecha_trabajo<=fecha_fin);
		RETURN QUERY 
		select * from saldo_anterior_oficina t1,saldo_final_oficina t2;
	END;
$BODY$;

---SALDOS EMPRESA
DROP FUNCTION IF EXISTS saldos_empresa2;
CREATE OR REPLACE FUNCTION saldos_empresa2(
	IN fecha_inicio DATE DEFAULT date(current_date),
	IN fecha_fin DATE DEFAULT date(current_date),
    IN empresa_cod VARCHAR(12) DEFAULT null
)
RETURNS TABLE (
	soles_anterior numeric,
	dolares_anterior numeric,
	soles_final numeric,
	dolares_final numeric
)
LANGUAGE 'plpgsql'    
  AS $BODY$
    BEGIN      
		drop table if exists saldo_anterior_empresa;
		CREATE TEMP TABLE saldo_anterior_empresa as(
		select sum("operacion_caja"."moneda1_Ingre" - "operacion_caja"."moneda1_Egre") as soles_anterior,
				sum("operacion_caja"."moneda2_Ingre" - "operacion_caja"."moneda2_Egre") as dolares_anterior
		from operacion_caja
		where oficina_origen_codigo in 
			(select oficina_codigo from oficina where empresa_codigo=empresa_cod and estado_registro='true')
			and fecha_trabajo<fecha_inicio);

		drop table if exists saldo_final_empresa;
		CREATE TEMP TABLE saldo_final_empresa as(
		select sum("operacion_caja"."moneda1_Ingre" - "operacion_caja"."moneda1_Egre") as soles_final,
				sum("operacion_caja"."moneda2_Ingre" - "operacion_caja"."moneda2_Egre") as dolares_final
		from operacion_caja
		where oficina_origen_codigo in 
			(select oficina_codigo from oficina where empresa_codigo=empresa_cod and estado_registro='true')
			and fecha_trabajo<=fecha_fin);
		RETURN QUERY 
		select * from saldo_anterior_empresa t1,saldo_final_empresa t2;
	END;
$BODY$;

--resumen
DROP FUNCTION IF EXISTS resumen_Detalle;
CREATE OR REPLACE FUNCTION resumen_Detalle(
	IN fecha_inicio TIMESTAMP WITH TIME ZONE ,
    IN fecha_final TIMESTAMP WITH TIME ZONE,
	IN oficina VARCHAR(12) DEFAULT '*'
)
RETURNS TABLE (
	empresa_codigo character varying,
	razon_social character varying,
	oficina_codigo character varying,
	oficina_nombre character varying,
	oficina_tipo character varying,
	habilitaciones numeric,
	pendientes numeric,
	recaudadas numeric,
	recibidas numeric,
	pagadas numeric,
	ingresossoles numeric,
	egresossoles numeric,
	ingresosdolares numeric,
	egresosdolares numeric
	
)
LANGUAGE 'plpgsql'    
  AS $BODY$
    BEGIN 
	RETURN QUERY 
		select empresa.empresa_codigo, empresa.razon_social, Ofi.oficina_codigo, 
		Ofi.oficina_nombre,Ofi.oficina_tipo,
		(COALESCE(Habi_e.totalImprte,0)-COALESCE(Habi_a.totalImprte,0)) as habilitaciones,
		COALESCE(pend.totalImprte,0) as pendientes,
		COALESCE(rec.totalImprte,0) as recaudadas,		
		COALESCE(reg.totalImprte,0) as recibidas,
		COALESCE(pag.totalImprte,0) as pagadas,
		COALESCE(recibos.totalingresossoles,0) as ingresossoles,
		COALESCE(recibos.totalegresossoles,0) as egresossoles,
		COALESCE(recibos.totalingresosdolares,0) as ingresosdolares,
		COALESCE(recibos.totalegresosdolares,0) as egresosdolares 
		from ( oficina as Ofi inner join empresa ON empresa.empresa_codigo = Ofi.empresa_codigo)
			--habiltiaciones enviadas
			left join ( select origen_oficina_codigo, sum(importe) as totalImprte
						from habilitacion 
						where habilitacion_estado  in ('PENDIENTE','ACEPTADO') 
						and "updatedAt" BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
						and ((DATE('20200131') + time '23:59:59')AT TIME ZONE 'PET')
						group by origen_oficina_codigo) as Habi_e
			on Habi_e.origen_oficina_codigo = Ofi.oficina_codigo
			--habiltiaciones aceptadas
			left join ( select destino_oficina_codigo, sum(importe) as totalImprte
						from habilitacion 
						where habilitacion_estado  in ('ACEPTADO')
					   	and "updatedAt" BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
						and ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET')
						group by destino_oficina_codigo) as Habi_a
			on Habi_a.destino_oficina_codigo = Ofi.oficina_codigo
			--pendientes
			left join ( select oficina_codigo_destino, sum(importe+ COALESCE(comision_banco,0)) as totalImprte
						from transferencia 
						where st_estado = 1 and
					   	solicitud_fecha_hora BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
						AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET')
						group by oficina_codigo_destino) as pend 
			on pend.oficina_codigo_destino = Ofi.oficina_codigo
			--recaudadas
			left join ( select oficina_codigo_origen, sum(importe + COALESCE(comision_dt,0) + COALESCE(comision_banco,0) + COALESCE(gastos_administrativos,0)) as totalImprte
						from transferencia 
					   	where st_estado in (1, 2) and 
						solicitud_fecha_hora BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
						AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET')
						group by oficina_codigo_origen) as rec 
			on rec.oficina_codigo_origen = Ofi.oficina_codigo
			--registradas
			left join ( select oficina_codigo_destino, sum(importe+ COALESCE(comision_banco,0)) as totalImprte
						from transferencia 
						where st_estado in (1, 2) and 
					   	solicitud_fecha_hora BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
						AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET')
						group by oficina_codigo_destino) as reg
			on reg.oficina_codigo_destino = Ofi.oficina_codigo
			--pagadas
			left join ( select oficina_codigo_destino, sum(importe+ COALESCE(comision_banco,0)) as totalImprte
						from transferencia 
						where st_estado = 2 and 
					  	op_fecha_hora BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
						AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET')
						group by oficina_codigo_destino) as pag 
			on pag.oficina_codigo_destino = Ofi.oficina_codigo
			--recibos internos
			left join ( select oficina_origen_codigo, sum(OCaj."moneda1_Ingre") as totalingresossoles, 
					   sum(OCaj."moneda1_Egre") as totalegresossoles, 
					   sum(OCaj."moneda2_Ingre") as totalingresosdolares,
					   sum(OCaj."moneda2_Egre") as totalegresosdolares
						from public.operacion_caja OCaj 
						where fecha_hora_operacion BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
						AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET')   
						and OCaj.modulo not in ('Transferencia','Op','Intercambio','Banco','Servicios',
												'Habilitacion','habilitacion') group by oficina_origen_codigo)
			as recibos 
			on recibos.oficina_origen_codigo = Ofi.oficina_codigo 
			WHERE  (
				CASE 
				  WHEN oficina != '*' THEN 
					Ofi.oficina_codigo = oficina
				  ELSE TRUE 
				END)
		order by Ofi.oficina_tipo,Ofi.oficina_nombre;
		
	END;
$BODY$;