DROP FUNCTION IF EXISTS cuentas_corrientes_oficinas;
CREATE OR REPLACE FUNCTION cuentas_corrientes_oficinas(
    IN id_oficina VARCHAR(12) DEFAULT '*',
	IN fechaInicio timestamp with time zone DEFAULT CURRENT_DATE,
	IN fechaFin timestamp with time zone DEFAULT CURRENT_DATE
  )
  RETURNS TABLE (
	  oficina_codigo_src VARCHAR(12),
	  oficina_nombre VARCHAR(50),
	  caja_codigo varchar(10),
	  caja_nombre varchar(150),
	  id_cuenta VARCHAR(50),
    --id_cliente VARCHAR(12),
	  razon_social VARCHAR(200),
	  fecha timestamp with time zone,
	  recibo_tipo VARCHAR(50),
	  moneda integer,
      importe NUMERIC,
      comision NUMERIC,
	  cta_observacion varchar(300)
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN
      RETURN QUERY
        select 
		      cc.oficina_codigo_src, oficina.oficina_nombre, oc.caja_codigo, caja.caja_nombre,
			  cc.id_cuenta, opc.razon_social, opc."createdAt", opc.recibo_tipo,
			  opc.moneda, opc.importe, opc.comision, cc.cta_observacion
        from  operacion_cuenta as opc
		left outer join operacion_caja as oc on opc.documento_codigo = oc.documento_codigo 
            and opc.documento_serie = oc.documento_serie
            and opc.nro_operacion = oc.nro_operacion
		left outer join cuenta_corriente as cc on cc.id_cuenta=opc.id_cuenta_tercera
		left outer join oficina on cc.oficina_codigo_src=oficina.oficina_codigo
		left outer join caja on oc.caja_codigo=caja.caja_codigo
		where cc.es_servicio = false
        and (CASE WHEN id_oficina != '*' THEN cc.oficina_codigo_src = id_oficina ELSE TRUE END)
		and opc."createdAt" BETWEEN ((DATE(fechaInicio) + time '00:00:00')AT TIME ZONE 'PET') 
			AND ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET') 
		order by opc."createdAt", cc.cta_observacion asc;
    END;
  $BODY$;