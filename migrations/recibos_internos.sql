DROP FUNCTION IF EXISTS reporte_recibosInternos;
CREATE OR REPLACE FUNCTION reporte_recibosInternos(
    IN in_oficina_codigo character varying,
    IN fecha_inicio timestamp with time zone,
    IN fecha_final timestamp with time zone
  )
  RETURNS TABLE (
	nro BIGINT ,
    documento_codigo VARCHAR(5),
    documento_serie integer,
	nro_operacion integer,
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
		OCaj.documento_codigo,OCaj.documento_serie,OCaj.nro_operacion,
		    (COALESCE(OCaj.concepto,'')||' '||COALESCE(Rec.recibo_concepto,'')) as concepto, OCaj.cliente_razon_social,
        OCaj."moneda1_Ingre", OCaj."moneda1_Egre", OCaj."moneda2_Ingre",OCaj."moneda2_Egre", 
		OCaj.usuario, OCaj.fecha_hora_operacion 
        from public.operacion_caja OCaj 
		left join recibo_interno Rec on (OCaj.documento_codigo=Rec.recibo_doc_codigo and 
										 OCaj.documento_serie = Rec.recibo_doc_serie and 
										 OCaj.nro_operacion = Rec.recibo_nro)
		left join oficina OfCaj on (OfCaj.oficina_codigo=OCaj.oficina_origen_codigo)
		where oficina_origen_codigo=in_oficina_codigo 
        and OCaj.fecha_hora_operacion BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
        AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET')   
        and OCaj.documento_codigo in ('RE-','RI-') 
		order by OCaj.documento_codigo,OCaj.documento_serie,OCaj.nro_operacion;
		END;
$BODY$;