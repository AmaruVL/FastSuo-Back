CREATE EXTENSION pg_trgm;
CREATE INDEX index_beneficiario_trgm ON transferencia USING GIN(beneficiario_razon_social gin_trgm_ops);
CREATE INDEX index_solicitante_trgm ON transferencia USING GIN(solicitante_razon_social gin_trgm_ops);
CREATE INDEX index_oficina_origen ON transferencia(oficina_codigo_origen);
CREATE INDEX index_oficina_destino ON transferencia(oficina_codigo_destino);
DROP FUNCTION IF EXISTS buscar_transferencias;
CREATE OR REPLACE FUNCTION buscar_transferencias(
    IN nombre_beneficiario VARCHAR(100) DEFAULT '*',
    IN estado integer DEFAULT 0,
    IN oficina_origen VARCHAR(12) DEFAULT '*',
    IN oficina_destino VARCHAR(12) DEFAULT '*',
    IN fecha_inicio timestamp with time zone DEFAULT CURRENT_DATE,
    IN fecha_fin timestamp with time zone DEFAULT CURRENT_DATE,
    IN bancos BOOLEAN DEFAULT false,
    IN codigoBanco VARCHAR(12) DEFAULT '*'
  )
  RETURNS TABLE (
    semejanza REAL,
    "St_documento_codigo" VARCHAR(4),
    "St_documento_serie" INTEGER,
    "nro_Solicitud" INTEGER,
    oficina_codigo_origen VARCHAR(12),
    oficina_codigo_destino VARCHAR(12),
	  usuario_registro VARCHAR(20),
    solicitud_fecha_hora TIMESTAMP WITH TIME ZONE,
    beneficiario_docident VARCHAR(11),
    beneficiario_id_cliente VARCHAR(12),
    beneficiario_razon_social VARCHAR(100),
    solicitante_id_cliente VARCHAR(12),
    solicitante_razon_social VARCHAR(100),
    moneda VARCHAR(4),
    importe DECIMAL(10, 3),
    beneficiario_nro_celular VARCHAR(12),
    solicitante_nro_celular VARCHAR(12),
    solicitud_obs VARCHAR(120),
    st_estado INTEGER,
    comision_dt DECIMAL(7, 3),
    comision_banco DECIMAL(7, 3),
    deposito_tipo VARCHAR(30),
    deposito_destino VARCHAR(20),
    deposito_nro_cuenta VARCHAR(25),
    tipo_giro VARCHAR(20),
    st_autorizada INTEGER,
    anulacion_usuario VARCHAR(20),
    anulacion_motivo VARCHAR(40),
    anulacion_fecha_hora TIMESTAMP WITH TIME ZONE,
    op_usuario VARCHAR(20),
    op_observacion VARCHAR(120),
    op_fecha_hora TIMESTAMP WITH TIME ZONE,
    autorizacion_estado BOOLEAN,
    dictado_usuario VARCHAR(20),
    dictado_fecha_hora TIMESTAMP WITH TIME ZONE,
    "oficinaOrigen.oficina_codigo" VARCHAR(12), 
    "oficinaOrigen.oficina_nombre" VARCHAR(20), 
    "oficinaOrigen.modo_conexion" INTEGER, 
    "oficinaDestino.oficina_codigo" VARCHAR(12),
    "oficinaDestino.oficina_nombre" VARCHAR(20),
    "oficinaDestino.modo_conexion" INTEGER, 
    "banco.entidad_codigo" VARCHAR(12),
    "banco.entidad_razon_social" VARCHAR(35),
    "banco.entidad_tipo" VARCHAR(12),
    "banco.createdAt" TIMESTAMP WITH TIME ZONE,
    "banco.updatedAt" TIMESTAMP WITH TIME ZONE,
    "beneficiario.id_cliente" VARCHAR(12),
    "beneficiario.fecha_nacimiento" DATE,
    "beneficiario.sexo" BOOLEAN
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN
      RETURN QUERY
        SELECT similarity("transferencia"."beneficiario_razon_social", nombre_beneficiario) AS semejanza, 
                "transferencia"."St_documento_codigo",
                "transferencia"."St_documento_serie",
                "transferencia"."nro_Solicitud",
                "transferencia"."oficina_codigo_origen",
                "transferencia"."oficina_codigo_destino",
                "opc"."usuario",
                "transferencia"."solicitud_fecha_hora",
                "transferencia"."beneficiario_docident",
                "transferencia"."beneficiario_id_cliente",
                "transferencia"."beneficiario_razon_social",
                "transferencia"."solicitante_id_cliente",
                "transferencia"."solicitante_razon_social",
                "transferencia"."moneda",
                "transferencia"."importe",
                "transferencia"."beneficiario_nro_celular",
                "transferencia"."solicitante_nro_celular",
                "transferencia"."solicitud_obs",
                "transferencia"."st_estado",
                "transferencia"."comision_dt",
                "transferencia"."comision_banco",
                "transferencia"."deposito_tipo",
                "transferencia"."deposito_destino",
                "transferencia"."deposito_nro_cuenta",
                "transferencia"."tipo_giro",
                "transferencia"."st_autorizada",
                "transferencia"."anulacion_usuario",
                "transferencia"."anulacion_motivo",
                "transferencia"."anulacion_fecha_hora",
                "transferencia"."op_usuario",
                "transferencia"."op_observacion",
                "transferencia"."op_fecha_hora",
                "transferencia"."autorizacion_estado",
                "transferencia"."dictado_usuario",
                "transferencia"."dictado_fecha_hora",
                "oficinaOrigen"."oficina_codigo" , 
                "oficinaOrigen"."oficina_nombre" , 
                "oficinaOrigen"."modo_conexion",
                "oficinaDestino"."oficina_codigo" ,
                "oficinaDestino"."oficina_nombre" ,
                "oficinaDestino"."modo_conexion",
                "banco"."entidad_codigo" ,
                "banco"."entidad_razon_social" ,
                "banco"."entidad_tipo" ,
                "banco"."createdAt" ,
                "banco"."updatedAt" ,
                "beneficiario"."id_cliente" ,
                "beneficiario"."fecha_nacimiento" ,
                "beneficiario"."sexo"
        FROM "transferencia"
          LEFT OUTER JOIN "operacion_caja" AS opc 
            ON "transferencia"."St_documento_codigo" = "opc"."documento_codigo" 
            AND "transferencia"."St_documento_serie" = "opc"."documento_serie"
            AND "transferencia"."nro_Solicitud" = "opc"."nro_operacion"
          LEFT OUTER JOIN "oficina" AS "oficinaOrigen" ON "transferencia"."oficina_codigo_origen" = "oficinaOrigen"."oficina_codigo" 
          LEFT OUTER JOIN "oficina" AS "oficinaDestino" ON "transferencia"."oficina_codigo_destino" = "oficinaDestino"."oficina_codigo" 
          LEFT OUTER JOIN "entidad_financiera_servicios" AS "banco" ON "transferencia"."deposito_entidad_codigo" = "banco"."entidad_codigo" 
          LEFT OUTER JOIN "cliente_proveedor" AS "beneficiario" ON "transferencia"."beneficiario_id_cliente" = "beneficiario"."id_cliente" 
        WHERE 
          "transferencia"."solicitud_fecha_hora" BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') AND ((DATE(fecha_fin) + time '23:59:59')AT TIME ZONE 'PET')
          AND (CASE 
                WHEN estado = 0 THEN TRUE 
                WHEN estado = 3 THEN "transferencia"."st_estado" IN (3, 4) 
                ELSE "transferencia"."st_estado" = estado 
              END)
          AND (
            CASE 
              WHEN bancos = TRUE and codigoBanco = '*' THEN 
                "transferencia"."tipo_giro" = 'Banco' 
              WHEN bancos = TRUE and codigoBanco != '*' THEN 
                "transferencia"."tipo_giro" = 'Banco' AND
                "transferencia"."deposito_entidad_codigo" = codigoBanco
              ELSE TRUE 
            END)
          AND (CASE WHEN oficina_origen != '*' THEN "transferencia"."oficina_codigo_origen" = oficina_origen ELSE TRUE END)
          AND (CASE WHEN oficina_destino != '*' THEN "transferencia"."oficina_codigo_destino" = oficina_destino ELSE TRUE END)
            AND (
            CASE 
              WHEN nombre_beneficiario ~ '^[0-9\.]+$' THEN 
                "transferencia"."beneficiario_docident" = nombre_beneficiario OR 
                "transferencia"."nro_Solicitud" = CAST (nombre_beneficiario AS INTEGER)
              WHEN nombre_beneficiario = '*' THEN 
               TRUE
              ELSE 
                similarity("transferencia"."beneficiario_razon_social", nombre_beneficiario)>0.10 OR
                similarity("transferencia"."solicitante_razon_social", nombre_beneficiario)>0.10 
            END
          )
        ORDER BY  semejanza DESC, solicitud_fecha_hora DESC
        LIMIT 50;
    END;
  $BODY$;