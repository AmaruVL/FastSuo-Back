DROP FUNCTION IF EXISTS saldos_cuenta_clientes;
CREATE OR REPLACE FUNCTION saldos_cuenta_clientes(
    IN id_cuenta_buscada VARCHAR(12) DEFAULT '*'
  )
  RETURNS TABLE (
    "id_cliente" VARCHAR(12),
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
          cc.id_cliente, 
          COALESCE(egresosoles.total, 0) AS retirosoles, 
          COALESCE(egresodolares.total, 0) AS retirodolares, 
          COALESCE(ingresosoles.total, 0) AS depositosoles, 
          COALESCE(ingresodolares.total, 0) AS depositodolares
        from  cuenta_corriente as cc
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
          and (CASE WHEN id_cuenta_buscada != '*' THEN cc.id_cuenta = id_cuenta_buscada ELSE TRUE END);

    END;
  $BODY$;