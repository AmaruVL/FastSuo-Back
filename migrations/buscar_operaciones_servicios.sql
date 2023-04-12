DROP FUNCTION IF EXISTS buscar_operaciones_servicios;
CREATE OR REPLACE FUNCTION buscar_operaciones_servicios(
    IN id_cuenta VARCHAR(12) DEFAULT '*',
    IN caja_origen VARCHAR(7) DEFAULT '*',
    IN fecha_inicio timestamp  DEFAULT CURRENT_DATE,
    IN fecha_fin timestamp DEFAULT CURRENT_DATE,
    IN oficina_cod VARCHAR(12) DEFAULT '*'
  )
  RETURNS TABLE (
    "documento_codigo" VARCHAR(4),
    "documento_serie" INTEGER,
    "nro_operacion" INTEGER,
    "fecha_hora_operacion"  TIMESTAMP WITH TIME ZONE,
    recibo_tipo VARCHAR(45),
    codigo_insumo VARCHAR(50),
    razon_social VARCHAR(250),
    importe DECIMAL(10, 3),
    comision DECIMAL(7, 3),
    id_cuenta_tercera VARCHAR(20),
    entidad_codigo VARCHAR(12),
    cuenta_codigo VARCHAR(12),
    "entidad.entidad_razon_social" VARCHAR(35),
    "oficinaOrigen.oficina_nombre" VARCHAR(20),
    "caja.caja_nombre" VARCHAR(120)
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN
      RETURN QUERY
        SELECT 
          operacion_cuenta.documento_codigo, 
          operacion_cuenta.documento_serie, 
          operacion_cuenta.nro_operacion, 
          opc.fecha_hora_operacion,
          operacion_cuenta.recibo_tipo, 
          operacion_cuenta.codigo_insumo,
          operacion_cuenta.razon_social, 
          operacion_cuenta.importe, 
          operacion_cuenta.comision, 
          operacion_cuenta.id_cuenta_tercera, 
          operacion_cuenta.entidad_codigo, 
          operacion_cuenta.cuenta_codigo, 
          ef.entidad_razon_social,
          oficina.oficina_nombre,
          caja.caja_nombre

        from operacion_cuenta
          left outer join entidad_financiera_servicios as ef on operacion_cuenta.entidad_codigo = ef.entidad_codigo
          left outer join operacion_caja as opc on operacion_cuenta.documento_codigo = opc.documento_codigo 
            and operacion_cuenta.documento_serie = opc.documento_serie
            and operacion_cuenta.nro_operacion = opc.nro_operacion
          left outer join oficina on opc.oficina_origen_codigo=oficina.oficina_codigo
          left outer join caja on opc.caja_codigo = caja.caja_codigo
        WHERE 
          (CASE WHEN id_cuenta != '*' THEN operacion_cuenta.id_cuenta_tercera = id_cuenta ELSE TRUE END)
          AND (CASE WHEN caja_origen != '*' THEN opc.caja_codigo = caja_origen ELSE TRUE END)
          AND (CASE WHEN oficina_cod != '*' THEN opc.oficina_origen_codigo = oficina_cod ELSE TRUE END)
          AND opc.fecha_trabajo between DATE(fecha_inicio) and DATE(fecha_fin)
          AND (opc.modulo = 'Servicios' or opc.modulo = 'Egreso Servicios')
        ORDER BY opc.fecha_hora_operacion ASC;
    END;
  $BODY$;