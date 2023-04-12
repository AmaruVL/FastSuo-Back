DROP FUNCTION IF EXISTS resumen_cc_clientes;
CREATE OR REPLACE FUNCTION resumen_cc_clientes(
    IN in_id_cliente VARCHAR(300) DEFAULT '*',
    IN fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE,
    IN fecha_fin TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE
  )
  RETURNS TABLE (
    "nro_operacion" text,
    "fecha_hora_operacion"  TIMESTAMP WITH TIME ZONE,
    razon_social VARCHAR(250),
    importe_ingreso DECIMAL(10, 3),
	importe_egreso DECIMAL(10, 3),
    comision DECIMAL(7, 3),
    moneda INTEGER,
    id_cuenta_tercera VARCHAR(20),
	concepto VARCHAR(400) 
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN
      RETURN QUERY
        SELECT 
          (operacion_cuenta.documento_codigo||operacion_cuenta.documento_serie||'-'||operacion_cuenta.nro_operacion) as nro_operacion,
          opc.fecha_hora_operacion,
          operacion_cuenta.razon_social, 
		  case when operacion_cuenta.recibo_tipo = 'INGRESO' and operacion_cuenta.moneda = 1 
		  	then operacion_cuenta.importe+operacion_cuenta.comision else 0.000 end as importe_ingreso,
		  case when operacion_cuenta.recibo_tipo = 'EGRESO' and operacion_cuenta.moneda = 1 
		  	then operacion_cuenta.importe+operacion_cuenta.comision else 0.000 end as importe_egreso,
          operacion_cuenta.comision, 
          operacion_cuenta.moneda, 
          operacion_cuenta.id_cuenta_tercera, 
		  opc.concepto

        from operacion_cuenta
          left outer join operacion_caja as opc on operacion_cuenta.documento_codigo = opc.documento_codigo 
            and operacion_cuenta.documento_serie = opc.documento_serie
            and operacion_cuenta.nro_operacion = opc.nro_operacion
		  left outer join cuenta_corriente as cc on operacion_cuenta.id_cuenta_tercera = cc.id_cuenta 
        WHERE 
          (CASE WHEN in_id_cliente != '*' THEN cc.id_cliente = in_id_cliente ELSE TRUE END)
          AND opc.fecha_trabajo between DATE(fecha_inicio) and DATE(fecha_fin)
          AND (opc.modulo = 'Retiro cuenta' or opc.modulo = 'Deposito cuenta');
    END;
  $BODY$;

DROP FUNCTION IF EXISTS saldos_cc_entre_fechas;
CREATE OR REPLACE FUNCTION saldos_cc_entre_fechas(
    IN in_id_cliente VARCHAR(12) DEFAULT '*',
	IN fecha_inicio timestamp  DEFAULT CURRENT_DATE,
    IN fecha_fin timestamp DEFAULT CURRENT_DATE
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
          sum(COALESCE(egresosoles.total, 0)) AS retirosoles, 
          sum(COALESCE(egresodolares.total, 0)) AS retirodolares, 
          sum(COALESCE(ingresosoles.total, 0)) AS depositosoles, 
          sum(COALESCE(ingresodolares.total, 0)) AS depositodolares
        from  cuenta_corriente as cc
          left join(
            select 
              id_cuenta_tercera,
              sum (importe + comision) total
            from operacion_cuenta as opc
            where 
              opc.recibo_tipo = 'EGRESO'
              and opc.moneda = 1
			  and opc."createdAt" BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
					AND ((DATE(fecha_fin) + time '23:59:59')AT TIME ZONE 'PET') 
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
			  and opc."createdAt" BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
					AND ((DATE(fecha_fin) + time '23:59:59')AT TIME ZONE 'PET')
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
			  and opc."createdAt" BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
					AND ((DATE(fecha_fin) + time '23:59:59')AT TIME ZONE 'PET')
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
			  and opc."createdAt" BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
					AND ((DATE(fecha_fin) + time '23:59:59')AT TIME ZONE 'PET')
            group by opc.id_cuenta_tercera, opc.moneda
          ) as ingresodolares on cc.id_cuenta = ingresodolares.id_cuenta_tercera
          where cc.es_servicio = false
          and (CASE WHEN in_id_cliente != '*' THEN cc.id_cliente = in_id_cliente ELSE TRUE END)
		  group by cc.id_cliente;

    END;
  $BODY$;

  DROP FUNCTION IF EXISTS saldos_cc_final;
CREATE OR REPLACE FUNCTION saldos_cc_final(
    IN in_id_cliente VARCHAR(12) DEFAULT '*',
    IN fecha_fin timestamp DEFAULT CURRENT_DATE
  )
  RETURNS TABLE (
    "id_cliente" VARCHAR(12),
    "total_soles" NUMERIC,
    "total_dolares" NUMERIC
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN
      RETURN QUERY

        select 
          cc.id_cliente, 
          sum(COALESCE(ingresosoles.total, 0) - COALESCE(egresosoles.total, 0)) AS total_soles, 
          sum(COALESCE(ingresodolares.total, 0) - COALESCE(egresodolares.total, 0)) AS total_dolares
        from  cuenta_corriente as cc
          left join(
            select 
              id_cuenta_tercera,
              sum (importe + comision) total
            from operacion_cuenta as opc
            where 
              opc.recibo_tipo = 'EGRESO'
              and opc.moneda = 1
			  and opc."createdAt" < ((DATE(fecha_fin) + time '23:59:59')AT TIME ZONE 'PET') 
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
			  and opc."createdAt" < ((DATE(fecha_fin) + time '23:59:59')AT TIME ZONE 'PET')
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
			  and opc."createdAt" < ((DATE(fecha_fin) + time '23:59:59')AT TIME ZONE 'PET')
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
			  and opc."createdAt" < ((DATE(fecha_fin) + time '23:59:59')AT TIME ZONE 'PET')
            group by opc.id_cuenta_tercera, opc.moneda
          ) as ingresodolares on cc.id_cuenta = ingresodolares.id_cuenta_tercera
          where cc.es_servicio = false
          and (CASE WHEN in_id_cliente != '*' THEN cc.id_cliente = in_id_cliente ELSE TRUE END)
		  group by cc.id_cliente;

    END;
  $BODY$;