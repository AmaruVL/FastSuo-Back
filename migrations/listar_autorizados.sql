DROP FUNCTION IF EXISTS listar_autorizados;
CREATE OR REPLACE FUNCTION listar_autorizados(
    IN cod_oficina_buscar VARCHAR(12)
  )
  RETURNS TABLE (
    "row" TEXT, 
    "opCaja.caja_codigo" VARCHAR(7) ,
    "St_documento_codigo" VARCHAR(4) , 
    "St_documento_serie" INTEGER , 
    "nro_Solicitud" INTEGER,
    "oficina_codigo_origen" VARCHAR(12) , 
    "oficina_codigo_destino" VARCHAR(12) , 
    "solicitud_fecha_hora" TIMESTAMP WITH TIME ZONE, 
    "beneficiario_id_cliente" VARCHAR(12), 
    "beneficiario_razon_social" VARCHAR(100), 
    "beneficiario_docident" VARCHAR(11), 
    "beneficiario_otros_datos" VARCHAR(45), 
    "solicitante_id_cliente" VARCHAR(12), 
    "solicitante_razon_social" VARCHAR(100), 
    "solicitante_otros_datos" VARCHAR(40), 
    "moneda" VARCHAR(4), 
    "importe" DECIMAL(10, 3), 
    "comision_dt" DECIMAL(7, 3), 
    "comision_banco" DECIMAL(7, 3), 
    "deposito_entidad_codigo" VARCHAR(12), 
    "beneficiario_nro_celular" VARCHAR(12), 
    "solicitante_nro_celular" VARCHAR(12), 
    "deposito_tipo" VARCHAR(30), 
    "deposito_destino" VARCHAR(20), 
    "deposito_nro_cuenta" VARCHAR(25), 
    "deposito_nro_operacion" VARCHAR(15), 
    "solicitud_obs" VARCHAR(120), 
    "autorizacion_fecha_hora" TIMESTAMP WITH TIME ZONE, 
    "autorizacion_usuario" VARCHAR(20), 
    "autorizacion_estado" BOOLEAN, 
    "st_autorizada" INTEGER, 
    "anulacion_usuario" VARCHAR(20), 
    "anulacion_motivo" VARCHAR(40), 
    "anulacion_fecha_hora" TIMESTAMP WITH TIME ZONE, 
    "op_usuario" VARCHAR(20), 
    "op_documento_codigo" VARCHAR(4), 
    "op_documento_serie" INTEGER, 
    "op_nro_operacion" INTEGER, 
    "op_fecha_hora" TIMESTAMP WITH TIME ZONE, 
    "op_observacion" VARCHAR(120), 
    "st_estado" INTEGER, 
    "tipo_giro" VARCHAR(20), 
    "solicitud_msj" VARCHAR(120), 
    "createdAt" TIMESTAMP WITH TIME ZONE, 
    "updatedAt" TIMESTAMP WITH TIME ZONE, 
    "oficinaOrigen.oficina_codigo" VARCHAR(12), 
    "oficinaOrigen.oficina_nombre"  VARCHAR(20), 
    "oficinaDestino.oficina_codigo"  VARCHAR(12), 
    "oficinaDestino.oficina_nombre"  VARCHAR(20)
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN
      RETURN QUERY
        SELECT DISTINCT (
          "transferencia"."St_documento_codigo", 
          "transferencia"."St_documento_serie", 
          "transferencia"."nro_Solicitud")::TEXT, 
          "opCaja"."caja_codigo",
          "transferencia"."St_documento_codigo", 
          "transferencia"."St_documento_serie", 
          "transferencia"."nro_Solicitud",
          "transferencia"."oficina_codigo_origen", 
          "transferencia"."oficina_codigo_destino", 
          "transferencia"."solicitud_fecha_hora", 
          "transferencia"."beneficiario_id_cliente", 
          "transferencia"."beneficiario_razon_social", 
          "transferencia"."beneficiario_docident", 
          "transferencia"."beneficiario_otros_datos", 
          "transferencia"."solicitante_id_cliente", 
          "transferencia"."solicitante_razon_social", 
          "transferencia"."solicitante_otros_datos", 
          "transferencia"."moneda", 
          "transferencia"."importe", 
          "transferencia"."comision_dt", 
          "transferencia"."comision_banco", 
          "transferencia"."deposito_entidad_codigo", 
          "transferencia"."beneficiario_nro_celular", 
          "transferencia"."solicitante_nro_celular", 
          "transferencia"."deposito_tipo", 
          "transferencia"."deposito_destino", 
          "transferencia"."deposito_nro_cuenta", 
          "transferencia"."deposito_nro_operacion", 
          "transferencia"."solicitud_obs", 
          "transferencia"."autorizacion_fecha_hora", 
          "transferencia"."autorizacion_usuario", 
          "transferencia"."autorizacion_estado", 
          "transferencia"."st_autorizada", 
          "transferencia"."anulacion_usuario", 
          "transferencia"."anulacion_motivo", 
          "transferencia"."anulacion_fecha_hora", 
          "transferencia"."op_usuario", 
          "transferencia"."op_documento_codigo", 
          "transferencia"."op_documento_serie", 
          "transferencia"."op_nro_operacion", 
          "transferencia"."op_fecha_hora", 
          "transferencia"."op_observacion", 
          "transferencia"."st_estado", 
          "transferencia"."tipo_giro", 
          "transferencia"."solicitud_msj", 
          "transferencia"."createdAt", 
          "transferencia"."updatedAt", 
          "oficinaOrigen"."oficina_codigo" AS "oficinaOrigen.oficina_codigo", 
          "oficinaOrigen"."oficina_nombre" AS "oficinaOrigen.oficina_nombre", 
          "oficinaDestino"."oficina_codigo" AS "oficinaDestino.oficina_codigo", 
          "oficinaDestino"."oficina_nombre" AS "oficinaDestino.oficina_nombre" 
        FROM 
          "transferencia" AS "transferencia"
          LEFT OUTER JOIN "oficina" AS "oficinaOrigen" ON "transferencia"."oficina_codigo_origen" = "oficinaOrigen"."oficina_codigo" 
          LEFT OUTER JOIN "oficina" AS "oficinaDestino" ON "transferencia"."oficina_codigo_destino" = "oficinaDestino"."oficina_codigo" 
          LEFT OUTER JOIN "operacion_caja" AS "opCaja" ON "transferencia"."St_documento_codigo" = "opCaja"."documento_codigo" 
            AND "transferencia"."St_documento_serie" = "opCaja"."documento_serie"  
            AND "transferencia"."nro_Solicitud" = "opCaja"."nro_operacion" 
        WHERE ("transferencia"."oficina_codigo_origen" = cod_oficina_buscar and "transferencia"."st_autorizada" in (1,2,3,4) and "transferencia"."st_estado" = 1)
          AND "transferencia"."autorizacion_estado" = true;
     END;
  $BODY$;