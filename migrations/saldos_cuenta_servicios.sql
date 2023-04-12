DROP FUNCTION IF EXISTS saldos_cuenta_servicios;
CREATE OR REPLACE FUNCTION saldos_cuenta_servicios(
    IN id_cuenta VARCHAR(12) DEFAULT '*',
    IN oficina_cod VARCHAR(12) DEFAULT '*'
  )
  RETURNS TABLE (
    "recibo_tipo" VARCHAR(45),
    "total" NUMERIC
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN
      RETURN QUERY
        select operacion_cuenta.recibo_tipo, sum(importe) as total
		from operacion_cuenta
		left outer join operacion_caja as opc 
					 on operacion_cuenta.documento_codigo = opc.documento_codigo 
					and operacion_cuenta.documento_serie = opc.documento_serie
					and operacion_cuenta.nro_operacion = opc.nro_operacion
		where (operacion_cuenta.recibo_tipo = 'INGRESO' or operacion_cuenta.recibo_tipo = 'EGRESO')
		and (opc.modulo = 'Servicios' or opc.modulo = 'Egreso Servicios')
		and (CASE WHEN id_cuenta != '*' THEN operacion_cuenta.id_cuenta_tercera = id_cuenta ELSE TRUE END)
		and (CASE WHEN oficina_cod != '*' THEN opc.oficina_origen_codigo = oficina_cod ELSE TRUE END)
		group by operacion_cuenta.recibo_tipo;
    END;
  $BODY$;