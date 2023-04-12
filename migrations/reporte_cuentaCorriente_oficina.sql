DROP FUNCTION IF EXISTS saldos_cuenta_oficinas;
CREATE OR REPLACE FUNCTION saldos_cuenta_oficinas(
    IN id_oficina VARCHAR(12) DEFAULT '*'
  )
  RETURNS TABLE (
	  "oficina_codigo_src" VARCHAR(12),
	  "oficina_nombre" VARCHAR(50),
    "id_cliente" VARCHAR(12),
	  "razon_social" VARCHAR(200),
    "retirosoles" NUMERIC,
    "retirodolares" NUMERIC,
    "depositosoles" NUMERIC,
    "depositodolares" NUMERIC
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN
      RETURN QUERY
        select 
		      cc.oficina_codigo_src,
		      oficina.oficina_nombre,
          cc.id_cliente, 
		      cliente_proveedor.razon_social,
          COALESCE(egresosoles.total, 0) AS retirosoles, 
          COALESCE(egresodolares.total, 0) AS retirodolares, 
          COALESCE(ingresosoles.total, 0) AS depositosoles, 
          COALESCE(ingresodolares.total, 0) AS depositodolares
        from  cuenta_corriente as cc
		    inner join oficina on cc.oficina_codigo_src=oficina.oficina_codigo
		    inner join cliente_proveedor on cc.id_cliente=cliente_proveedor.id_cliente
          left join(
            select 
              id_cuenta_tercera,
              sum (importe + comision) total
            from operacion_cuenta as opc
            where 
              opc.recibo_tipo = 'EGRESO'
              and opc.moneda = 1
            group by opc.id_cuenta_tercera, opc.moneda
          ) as egresosoles on cc.id_cuenta = egresosoles.id_cuenta_tercera
          left join(
            select 
              id_cuenta_tercera,
              sum (importe + comision) total
            from operacion_cuenta as opc
            where 
              opc.recibo_tipo = 'EGRESO'
              and opc.moneda = 2
            group by opc.id_cuenta_tercera, opc.moneda
          ) as egresodolares on cc.id_cuenta = egresodolares.id_cuenta_tercera
          left join(
            select 
              id_cuenta_tercera,
              sum (importe) total
            from operacion_cuenta as opc
            where 
              opc.recibo_tipo = 'INGRESO'
              and opc.moneda = 1
            group by opc.id_cuenta_tercera, opc.moneda
          ) as ingresosoles on cc.id_cuenta = ingresosoles.id_cuenta_tercera
          left join(
            select 
              id_cuenta_tercera,
              sum (importe) total
            from operacion_cuenta as opc
            where 
              opc.recibo_tipo = 'INGRESO'
              and opc.moneda = 2
            group by opc.id_cuenta_tercera, opc.moneda
          ) as ingresodolares on cc.id_cuenta = ingresodolares.id_cuenta_tercera
          where cc.es_servicio = false
          and (CASE WHEN id_oficina != '*' THEN cc.oficina_codigo_src = id_oficina ELSE TRUE END);

    END;
  $BODY$;