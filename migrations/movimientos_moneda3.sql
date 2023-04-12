--CAJA
DROP FUNCTION IF EXISTS saldos_caja_moneda3;
CREATE OR REPLACE FUNCTION saldos_caja_moneda3(
	IN fecha_inicio DATE DEFAULT date(current_date),
	IN fecha_fin DATE DEFAULT date(current_date),
    IN caja_cod VARCHAR(12) DEFAULT null
)
RETURNS TABLE (
	moneda3_anterior numeric,
	moneda3_final numeric
)
LANGUAGE 'plpgsql'    
  AS $BODY$
    BEGIN      
		drop table if exists saldo_anterior_caja;
		CREATE TEMP TABLE saldo_anterior_caja as(
		select sum("operacion_caja"."moneda3_Ingre" - "operacion_caja"."moneda3_Egre") as moneda3_anterior
		from operacion_caja
		where caja_codigo in 
        (select caja_codigo from caja where caja_codigo=caja_cod) and fecha_trabajo<fecha_inicio);

		drop table if exists saldo_final_caja;
		CREATE TEMP TABLE saldo_final_caja as(
		select sum("operacion_caja"."moneda3_Ingre" - "operacion_caja"."moneda3_Egre") as moneda3_final
		from operacion_caja
		where caja_codigo in 
        (select caja_codigo from caja where caja_codigo=caja_cod) and fecha_trabajo<=fecha_fin);
		RETURN QUERY 
		select * from saldo_anterior_caja t1,saldo_final_caja t2;
	END;
$BODY$;

DROP FUNCTION IF EXISTS resumen_caja_moneda3;
CREATE OR REPLACE FUNCTION resumen_caja_moneda3(
  	IN in_caja_codigo character varying DEFAULT '*',
	IN razon_social VARCHAR(100) DEFAULT '*',
  	IN fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE,
  	IN fecha_final TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE
  )
  RETURNS TABLE (
    documento_codigo VARCHAR(4),
	documento_serie INTEGER,
	nro_operacion INTEGER,
    cliente_razon_social VARCHAR(100),
	oficina_origen_codigo VARCHAR(12),
	oficina_nombre VARCHAR(20),
	concepto VARCHAR(100), 
	"moneda1_Ingre" DECIMAL(10,2),
	"moneda1_Egre" DECIMAL(10,2),
    "moneda3_Ingre" DECIMAL(10,2),
	"moneda3_Egre" DECIMAL(10,2),
    fecha_hora_operacion TIMESTAMP WITH TIME ZONE
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN
      RETURN QUERY
        select OCaja.documento_codigo, OCaja.documento_serie, OCaja.nro_operacion, OCaja.cliente_razon_social, 
		OCaja.oficina_origen_codigo, OfOrigen.oficina_nombre, OCaja.concepto, 
		OCaja."moneda1_Ingre", OCaja."moneda1_Egre", OCaja."moneda3_Ingre", OCaja."moneda3_Egre", OCaja.fecha_hora_operacion 
        from operacion_caja as OCaja
        inner join oficina OfOrigen on OCaja.oficina_origen_codigo = OfOrigen.oficina_codigo 
        where OCaja.caja_codigo = in_caja_codigo 
		and OCaja.modulo='Materiales' 
		and (CASE WHEN razon_social = '*' THEN TRUE 
              ELSE OCaja.cliente_razon_social ilike ('%' ||razon_social|| '%') END)
        and OCaja.fecha_hora_operacion BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
		    AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET');
	  END;
  $BODY$;
  
--OFICINA
DROP FUNCTION IF EXISTS saldos_oficina_moneda3;
CREATE OR REPLACE FUNCTION saldos_oficina_moneda3(
	IN fecha_inicio DATE DEFAULT date(current_date),
	IN fecha_fin DATE DEFAULT date(current_date),
    IN oficina_cod VARCHAR(12) DEFAULT null
)
RETURNS TABLE (
	moneda3_anterior numeric,
	moneda3_final numeric
)
LANGUAGE 'plpgsql'    
  AS $BODY$
    BEGIN      
		drop table if exists saldo_anterior_oficina;
		CREATE TEMP TABLE saldo_anterior_oficina as(
		select sum("operacion_caja"."moneda3_Ingre" - "operacion_caja"."moneda3_Egre") as moneda3_anterior
		from operacion_caja
		where oficina_origen_codigo=oficina_cod and fecha_trabajo<fecha_inicio);

		drop table if exists saldo_final_oficina;
		CREATE TEMP TABLE saldo_final_oficina as(
		select sum("operacion_caja"."moneda3_Ingre" - "operacion_caja"."moneda3_Egre") as moneda3_final
		from operacion_caja
		where oficina_origen_codigo=oficina_cod and fecha_trabajo<=fecha_fin);
		RETURN QUERY 
		select * from saldo_anterior_oficina t1,saldo_final_oficina t2;
	END;
$BODY$;

DROP FUNCTION IF EXISTS resumen_oficina_moneda3;
CREATE OR REPLACE FUNCTION resumen_oficina_moneda3(
  	IN in_oficina_codigo character varying DEFAULT '*',
	IN razon_social VARCHAR(100) DEFAULT '*',
  	IN fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE,
  	IN fecha_final TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE
  )
  RETURNS TABLE (
    documento_codigo VARCHAR(4),
	documento_serie INTEGER,
	nro_operacion INTEGER,
    cliente_razon_social VARCHAR(100),
	oficina_origen_codigo VARCHAR(12),
	oficina_nombre VARCHAR(20),
	concepto VARCHAR(100), 
	"moneda1_Ingre" DECIMAL(10,2),
	"moneda1_Egre" DECIMAL(10,2),
    "moneda3_Ingre" DECIMAL(10,2),
	"moneda3_Egre" DECIMAL(10,2),
    fecha_hora_operacion TIMESTAMP WITH TIME ZONE
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN
      RETURN QUERY
        select OCaja.documento_codigo, OCaja.documento_serie, OCaja.nro_operacion, OCaja.cliente_razon_social, 
		OCaja.oficina_origen_codigo, OfOrigen.oficina_nombre, OCaja.concepto, 
		OCaja."moneda1_Ingre", OCaja."moneda1_Egre", OCaja."moneda3_Ingre", OCaja."moneda3_Egre", OCaja.fecha_hora_operacion 
        from operacion_caja as OCaja
        inner join oficina OfOrigen on OCaja.oficina_origen_codigo = OfOrigen.oficina_codigo 
        where OCaja.oficina_origen_codigo = in_oficina_codigo 
		and OCaja.modulo='Materiales' 
		and (CASE WHEN razon_social = '*' THEN TRUE 
              ELSE OCaja.cliente_razon_social ilike ('%' ||razon_social|| '%') END)
        and OCaja.fecha_hora_operacion BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
		    AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET')
		order by OCaja.fecha_hora_operacion,OCaja.documento_codigo, OCaja.documento_serie, OCaja.nro_operacion;
	  END;
  $BODY$;