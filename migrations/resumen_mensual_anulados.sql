DROP FUNCTION IF EXISTS resumen_mensual_descuentos2;
CREATE OR REPLACE FUNCTION resumen_mensual_descuentos2(
    IN oficina_origen VARCHAR(12) DEFAULT '*',
    IN oficina_destino VARCHAR(12) DEFAULT '*',
    IN oficina_tipo_arreglo VARCHAR(18) DEFAULT 'REAL',
    IN fecha_inicio timestamp with time zone DEFAULT (date_trunc('MONTH', current_date)),
    IN fecha_fin timestamp with time zone DEFAULT (date_trunc('MONTH', current_date) + INTERVAL '1 MONTH - 1 day')
  )
  RETURNS TABLE (
    "St_documento_codigo" VARCHAR(4),
    "St_documento_serie" INTEGER,
    "nro_Solicitud" INTEGER,
    "op_documento_codigo" VARCHAR(4),
    "op_documento_serie" INTEGER,
    "op_nro_operacion" INTEGER,
    solicitud_obs VARCHAR(400),
    oficinaOrigen VARCHAR(20),
    oficinaDestino VARCHAR(20),
    solicitud_fecha_hora TIMESTAMP WITH TIME ZONE,
    anulacion_fecha_hora TIMESTAMP WITH TIME ZONE,
    beneficiario_razon_social VARCHAR(100),
    solicitante_razon_social VARCHAR(100),
    importe DECIMAL(10, 3),
	 comision_banco DECIMAL(7,3),
    comision_dt DECIMAL(7, 3),
    st_estado TEXT,
    oficina_origen_tipo VARCHAR(10),
    origen_dt_directo DECIMAL(8, 3),
    origen_dt_afiliado DECIMAL(8, 3),
    origen_dt_tercero DECIMAL(8, 3),
    oficina_destino_tipo VARCHAR(10),
    destino_dt_directo DECIMAL(8, 3),
    destino_dt_afiliado DECIMAL(8, 3),
    destino_dt_tercero DECIMAL(8, 3),
    PorcentajeOrigen NUMERIC,
    PorcentajeDestino NUMERIC,
    ComisionOrigen NUMERIC,
    ComisionDestino NUMERIC
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN
      RETURN QUERY
        select *,
          CASE "tabla1"."st_estado"
            WHEN 'REEMBOLSADO' THEN ("tabla1"."comision_dt" * "PorcentajeOrigen"):: DECIMAL(8, 4)
            ELSE 0 :: DECIMAL(8, 4)
          END as "ComisionOrigen",
          CASE "tabla1"."st_estado"
            WHEN 'REEMBOLSADO' THEN ("tabla1"."comision_dt" * "PorcentajeDestino") :: DECIMAL(8, 4)
            WHEN 'ANULADO' THEN ("tabla1"."comision_dt" * "PorcentajeDestino") :: DECIMAL(8, 4)
            ELSE 0 :: DECIMAL(8, 4) 
          END as "ComisionDestino"
        from (
          SELECT 
          "transferencia"."St_documento_codigo",
          "transferencia"."St_documento_serie", 
          "transferencia"."nro_Solicitud",
          "transferencia"."op_documento_codigo",
          "transferencia"."op_documento_serie", 
          "transferencia"."op_nro_operacion",
          "transferencia"."solicitud_obs",
          "origen"."oficina_nombre" AS "oficinaOrigen",
          "destino"."oficina_nombre" AS "oficinaDestino",
          "transferencia"."solicitud_fecha_hora",
          "transferencia"."anulacion_fecha_hora",
          "transferencia"."beneficiario_razon_social",
          "transferencia"."solicitante_razon_social",
          "transferencia"."importe",
			COALESCE("transferencia"."comision_banco",0),
          "transferencia"."comision_dt",
          CASE 
            WHEN ((DATE(fecha_fin) + time '23:59:59')AT TIME ZONE 'PET')> "transferencia"."anulacion_fecha_hora" AND "transferencia"."st_estado" = 4 THEN 
              'ANULADO'
            WHEN ((DATE(fecha_fin) + time '23:59:59')AT TIME ZONE 'PET')> "transferencia"."anulacion_fecha_hora" AND "transferencia"."st_estado" = 3 THEN 
              'REEMBOLSADO'
            WHEN ((DATE(fecha_fin) + time '23:59:59')AT TIME ZONE 'PET')> "transferencia"."op_fecha_hora"  THEN 
              'PAGADO'
            ELSE 'PENDIENTE'
          END AS "st_estado",
          "origen"."oficina_tipo" as "oficina_origen_tipo",
          coalesce("contratoOrigen"."dt_directo", 0):: DECIMAL(8, 3) as "origen_dt_directo",
          coalesce("contratoOrigen"."dt_afiliado", 0):: DECIMAL(8, 3) as "origen_dt_afiliado",
          coalesce("contratoOrigen"."dt_tercero", 0):: DECIMAL(8, 3) as "origen_dt_tercero",
          "destino"."oficina_tipo" as "oficina_destino_tipo",
          coalesce("contratoDestino"."dt_directo" , 0):: DECIMAL(8, 3)  as "destino_dt_directo",
          coalesce("contratoDestino"."dt_afiliado", 0):: DECIMAL(8, 3) as "destino_dt_afiliado",
          coalesce("contratoDestino"."dt_tercero", 0):: DECIMAL(8, 3) as "destino_dt_tercero",
          CASE "destino"."oficina_tipo"
            WHEN 'Propio' THEN (coalesce(("contratoOrigen"."dt_directo"/100) , 0)) :: DECIMAL(8, 4)
            WHEN 'Afiliado' THEN (coalesce(("contratoOrigen"."dt_afiliado"/100) , 0)) :: DECIMAL(8, 4)
            ELSE null
          END as "PorcentajeOrigen",
          CASE "origen"."oficina_tipo"
            WHEN 'Propio' THEN (coalesce(("contratoDestino"."dt_directo"/100) , 0)) :: DECIMAL(8, 4)
            WHEN 'Afiliado' THEN (coalesce(("contratoDestino"."dt_afiliado"/100) , 0)) :: DECIMAL(8, 4)
            ELSE null
          END as "PorcentajeDestino"

          FROM "transferencia" 
          LEFT OUTER JOIN "oficina" AS "origen" ON "transferencia"."oficina_codigo_origen" = "origen"."oficina_codigo"
          LEFT OUTER JOIN "oficina" AS "destino" ON "transferencia"."oficina_codigo_destino" = "destino"."oficina_codigo"
          LEFT OUTER JOIN "contrato" AS "contratoOrigen" ON "transferencia"."oficina_codigo_origen" = "contratoOrigen"."oficina_codigo"
          LEFT OUTER JOIN "contrato" AS "contratoDestino" ON "transferencia"."oficina_codigo_destino" = "contratoDestino"."oficina_codigo"
          WHERE 
            (CASE WHEN oficina_origen != '*' THEN 
                    "origen"."oficina_codigo" = oficina_origen
                  WHEN oficina_destino != '*' THEN 
                    "destino"."oficina_codigo" = oficina_destino
                  ELSE true 
            END) AND
            "transferencia".st_estado IN (3, 4) AND
            "transferencia".solicitud_fecha_hora < ((DATE(fecha_inicio) + time '00:00:00') AT TIME ZONE 'PET') AND 
            "transferencia".anulacion_fecha_hora between ((DATE(fecha_inicio) + time '00:00:00') AT TIME ZONE 'PET') and ((DATE(fecha_fin) + time '23:59:59') AT TIME ZONE 'PET')
		      ORDER BY (CASE WHEN oficina_tipo_arreglo = 'REAL' THEN  "transferencia"."op_fecha_hora"ELSE "transferencia"."solicitud_fecha_hora" END) ASC 
        ) tabla1;
    END;
  $BODY$;