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

DROP FUNCTION IF EXISTS recibidos_oficina;
CREATE OR REPLACE FUNCTION recibidos_oficina(
    IN oficina_destino character varying DEFAULT '*',
    IN fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE,
    IN fecha_fin TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE
  )
  RETURNS TABLE (
    nro BIGINT ,
    oficinaOrigen VARCHAR(20),
	oficinaDestino VARCHAR(20),
    "nro_Solicitud" text,
    beneficiario_razon_social VARCHAR(100),
    solicitante_razon_social VARCHAR(100),
    solicitud_fecha_hora TIMESTAMP WITH TIME ZONE,
    importe_soles DECIMAL(7, 2),
    comision_dt DECIMAL(7, 2),
    importe_dolares DECIMAL(10, 3),
    comision_banco DECIMAL(7, 3),
    st_estado integer
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN
      RETURN QUERY
		select row_number() OVER (ORDER BY OfDestino.oficina_nombre ASC,
								  "Giro"."St_documento_codigo",
								  "Giro"."St_documento_serie","Giro"."nro_Solicitud" ASC) "nro",
		OfOrigen.oficina_nombre, OfDestino.oficina_nombre, 
		("Giro"."St_documento_codigo"||"Giro"."St_documento_serie"||'-'||"Giro"."nro_Solicitud") as nro_operacion, "Giro".beneficiario_razon_social,
		"Giro".solicitante_razon_social,"Giro"."solicitud_fecha_hora",
		CASE "Giro"."moneda"
			WHEN '1' THEN "Giro"."importe":: DECIMAL(7, 2) ELSE (0.00):: DECIMAL(7, 2) END AS "importe_soles",
		"Giro"."comision_dt":: DECIMAL(7, 2),
		CASE "Giro"."moneda"
			WHEN '2' THEN "Giro"."importe":: DECIMAL(7, 2) ELSE (0.00):: DECIMAL(7, 2) END AS "importe_dolares",
		COALESCE( "Giro"."comision_banco",(0.00):: DECIMAL(7, 2)) as "comision_banco", 
		"Giro".st_estado 
		from public.transferencia as "Giro" 			
		inner join oficina OfOrigen on "Giro"."oficina_codigo_origen"=OfOrigen."oficina_codigo" 
		inner join oficina OfDestino on "Giro"."oficina_codigo_destino"=OfDestino."oficina_codigo" 
		where
			"Giro"."oficina_codigo_destino" = oficina_destino  
			and "Giro"."solicitud_fecha_hora" 
				BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
				AND ((DATE(fecha_fin) + time '23:59:59')AT TIME ZONE 'PET');
	END;
  $BODY$;

DROP FUNCTION IF EXISTS recibos_internos_OfCont;
CREATE OR REPLACE FUNCTION recibos_internos_OfCont(
    IN in_oficina character varying DEFAULT '*',
    IN fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE,
    IN fecha_fin TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE
  )
  RETURNS TABLE (
    nro BIGINT ,
    documento_codigo VARCHAR(20),
	documento_serie integer,
    documento_nro integer,
    concepto VARCHAR(200),
    razon_social VARCHAR(100),
    ingreso_soles DECIMAL(7, 3),
    ingreso_dolares DECIMAL(7, 3),
    egreso_soles DECIMAL(7, 3),
    egreso_dolares DECIMAL(10, 3),
    fecha_hora_operacion TIMESTAMP WITH TIME ZONE
  ) 
  LANGUAGE 'plpgsql'
  AS $BODY$
    BEGIN
      RETURN QUERY
	  	select row_number() OVER (ORDER BY recibos.documento_codigo,recibos.documento_serie,recibos.documento_nro ASC, 
		recibos.fecha_hora_operacion ASC) "nro",* 
		from(
			select recibo_doc_codigo as documento_codigo,recibo_doc_serie as documento_serie,
			recibo_nro as documento_nro,recibo_concepto as concepto,Rec.razon_social,
			case Giro.moneda when '1' then Giro.importe end as ingreso_soles, 
			case Giro.moneda when '2' then Giro.importe end as ingreso_dolares,
			0 as egreso_soles,0 as egreso_dolares,recibo_fecha_hora as fecha_hora_operacion 
			from recibo_interno Rec  
			left outer join transferencia Giro on (Rec.anulacion_doc_codigo=Giro."St_documento_codigo" and
													 Rec.anulacion_doc_serie=Giro."St_documento_serie" and 
													 Rec.anulacion_recibo_nro=Giro."nro_Solicitud")
			where Giro.oficina_codigo_destino=in_oficina  
			and Rec.recibo_fecha_hora BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
					AND ((DATE(fecha_fin) + time '23:59:59')AT TIME ZONE 'PET')
			union
			select OCaj.documento_codigo,OCaj.documento_serie,nro_operacion as documento_nro,
			(COALESCE(OCaj.concepto,'')||' '||COALESCE(Rec.recibo_concepto,'')) as concepto,
			OCaj.cliente_razon_social as razon_social,OCaj."moneda1_Ingre" as ingreso_soles, 
			OCaj."moneda2_Ingre" as ingreso_dolares, OCaj."moneda1_Egre" as egreso_soles,
			OCaj."moneda2_Egre" as egreso_dolares,OCaj.fecha_hora_operacion 
			from public.operacion_caja OCaj 
			full join recibo_interno Rec on (OCaj.documento_codigo=Rec.recibo_doc_codigo and 
											 OCaj.documento_serie = Rec.recibo_doc_serie and 
											 OCaj.nro_operacion = Rec.recibo_nro)
			where OCaj.oficina_origen_codigo=in_oficina  
			and OCaj.fecha_hora_operacion BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
				AND ((DATE(fecha_fin) + time '23:59:59')AT TIME ZONE 'PET')   
			and OCaj.modulo not in ('Transferencia','Op','Intercambio','Banco','Servicios')) recibos;
	END;
$BODY$;