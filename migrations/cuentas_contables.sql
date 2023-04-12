DROP FUNCTION IF EXISTS buscar_cuentas2;
CREATE OR REPLACE FUNCTION buscar_cuentas2(
      IN id_cuenta VARCHAR(12) DEFAULT '*',
      IN in_codigo_oficina VARCHAR(12) DEFAULT '*',
      IN razonsocial VARCHAR(100) DEFAULT '*',
      IN fecha_inicio timestamp  DEFAULT CURRENT_DATE,
      IN fecha_fin timestamp DEFAULT CURRENT_DATE
    )
    RETURNS TABLE (
      "documento_codigo" VARCHAR(4),
      "documento_serie" INTEGER,
      "nro_operacion" INTEGER,  
	  oficina_nombre VARCHAR(100),
      cuenta_codigo VARCHAR(50),
      cuenta_denominacion VARCHAR(250),
      cliente_razon_social VARCHAR(12),
      concepto varchar(100),
      "fecha_hora_operacion"  TIMESTAMP WITH TIME ZONE,
      moneda1_Ingre DECIMAL(10, 3),
      moneda1_Egre DECIMAL(10, 3),
      moneda2_Ingre DECIMAL(10, 3),
      moneda2_Egre DECIMAL(10, 3),
    recibotipo varchar(50)
    ) 
    LANGUAGE 'plpgsql'
      
    AS $BODY$
      BEGIN
        RETURN QUERY
          SELECT 
            OCaj.documento_codigo, OCaj.documento_serie, OCaj.nro_operacion, oficina.oficina_nombre,cuenta.cuenta_codigo,
            cuenta.cuenta_denominacion, Rec.razon_social, Rec.recibo_concepto,OCaj.fecha_hora_operacion,
            OCaj."moneda1_Ingre", OCaj."moneda1_Egre", OCaj."moneda2_Ingre", OCaj."moneda2_Egre",
            Rec.recibo_tipo 
          from operacion_caja OCaj
          inner join oficina on OCaj.oficina_origen_codigo = oficina.oficina_codigo 
          inner join cuenta on OCaj.cuenta_codigo = cuenta.cuenta_codigo
          inner join recibo_interno Rec on (OCaj.documento_codigo = Rec.recibo_doc_codigo and 
                      OCaj.documento_serie = Rec.recibo_doc_serie and
                      OCaj.nro_operacion = Rec.recibo_nro)
          WHERE 
            (CASE WHEN in_codigo_oficina != '*' THEN OCaj.oficina_origen_codigo = in_codigo_oficina ELSE TRUE END)
            and (CASE WHEN id_cuenta != '*' THEN OCaj.cuenta_codigo = id_cuenta ELSE TRUE END)
            and (CASE WHEN razonsocial = '*' THEN TRUE 
                ELSE OCaj.cliente_razon_social ilike ('%' ||razonsocial|| '%') END)
            AND OCaj.fecha_hora_operacion BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
                AND ((DATE(fecha_fin) + time '23:59:59')AT TIME ZONE 'PET') 
          order by OCaj.fecha_hora_operacion,OCaj.documento_codigo, OCaj.documento_serie, OCaj.nro_operacion;
      END;
    $BODY$;

--SALDOS
DROP FUNCTION IF EXISTS saldos_cuenta_contables;
CREATE OR REPLACE FUNCTION saldos_cuenta_contables(
    IN id_cuenta VARCHAR(12) DEFAULT '*'
  )
  RETURNS TABLE (
    "moneda1Ingre" NUMERIC,
    "moneda1Egre" NUMERIC,
    "moneda2Ingre" NUMERIC,
    "moneda2Egre" NUMERIC
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN
      RETURN QUERY
        select sum(OCaj."moneda1_Ingre"), sum(OCaj."moneda1_Egre"),
		      sum(OCaj."moneda2_Ingre"), sum(OCaj."moneda2_Egre") 
        from operacion_caja OCaj 
        inner join cuenta on OCaj.cuenta_codigo = cuenta.cuenta_codigo 
        inner join recibo_interno Rec
					on (OCaj.documento_codigo = Rec.recibo_doc_codigo and 
						OCaj.documento_serie = Rec.recibo_doc_serie and
						OCaj.nro_operacion = Rec.recibo_nro)
		    where (CASE WHEN id_cuenta != '*' THEN OCaj.cuenta_codigo = id_cuenta ELSE TRUE END);
    END;
  $BODY$;