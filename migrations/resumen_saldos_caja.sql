DROP FUNCTION IF EXISTS resumen_saldos_caja;
CREATE OR REPLACE FUNCTION resumen_saldos_caja()
RETURNS TABLE (
	caja_codigo character varying,
	caja_nombre character varying,
	oficina_codigo character varying,
	oficina_tipo character varying,
	soles DECIMAL(10, 3),
	dolares DECIMAL(10, 3)
)
LANGUAGE 'plpgsql'
  AS $BODY$
    BEGIN
      RETURN QUERY
		select caja.caja_codigo,caja.caja_nombre,"oficina"."oficina_codigo","oficina"."oficina_tipo",
		coalesce(sum("operacion_caja"."moneda1_Ingre" - "operacion_caja"."moneda1_Egre"),0) as soles,
		coalesce(sum("operacion_caja"."moneda2_Ingre" - "operacion_caja"."moneda2_Egre"),0) as dolares
		from operacion_caja
		right outer join caja on operacion_caja.caja_codigo=caja.caja_codigo 
		right outer join oficina on caja.oficina_codigo=oficina.oficina_codigo 		
		group by caja.caja_codigo,caja.caja_nombre,"oficina"."oficina_codigo"
		order by "oficina"."oficina_codigo";
	END;
$BODY$;