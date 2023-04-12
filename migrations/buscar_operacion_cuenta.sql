DROP FUNCTION IF EXISTS buscar_op_cuenta;
CREATE OR REPLACE FUNCTION buscar_op_cuenta(
    IN documento VARCHAR(100) DEFAULT '',
    IN serie integer DEFAULT 0,
    IN operacion integer DEFAULT 0
  )
  RETURNS TABLE (
    "documento_codigo" VARCHAR(4),	
	"documento_serie" INTEGER,
	"nro_operacion" INTEGER,
	"recibo_tipo" VARCHAR(45),
	"codigo_insumo" VARCHAR(50),	
	"razon_social" VARCHAR(250),
	"importe" DECIMAL(10, 3),
	"comision" DECIMAL(7, 3),
	"cuenta_nro_operacion" VARCHAR(20),
	"operacion_caja.fecha_hora_operacion" TIMESTAMP WITH TIME ZONE,
	"operacion_caja.id_cliente" VARCHAR(12),
	"operacion_caja.oficina_origen_codigo" VARCHAR(12),
	"operacion_caja.fecha_trabajo" DATE,
	"operacion_caja.caja_codigo" VARCHAR(7),
	"operacion_caja.cuenta_codigo" VARCHAR(8),
	"operacion_caja.modulo" VARCHAR(20),
	"oficinaOrigen.oficina_codigo" VARCHAR(12),
	"oficinaOrigen.oficina_nombre" VARCHAR(20),
	"banco.entidad_codigo" VARCHAR(12),
	"banco.entidad_razon_social" VARCHAR(35),
	"banco.entidad_tipo" VARCHAR(12)
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN
      RETURN QUERY
		select  
			"operacion_cuenta"."documento_codigo",	
			"operacion_cuenta"."documento_serie",
			"operacion_cuenta"."nro_operacion",
			"operacion_cuenta"."recibo_tipo",
			"operacion_cuenta"."codigo_insumo",	
			"operacion_cuenta"."razon_social",
			"operacion_cuenta"."importe",
			"operacion_cuenta"."comision",
			"operacion_cuenta"."cuenta_nro_operacion",
			"operacion_caja"."fecha_hora_operacion",
			"operacion_caja"."id_cliente",
			"operacion_caja"."oficina_origen_codigo",
			"operacion_caja"."fecha_trabajo",
			"operacion_caja"."caja_codigo",
			"operacion_caja"."cuenta_codigo",
			"operacion_caja"."modulo",
			"oficinaOrigen"."oficina_codigo",
			"oficinaOrigen"."oficina_nombre",
			"banco"."entidad_codigo",
			"banco"."entidad_razon_social",
			"banco"."entidad_tipo"

		from operacion_caja 

		left outer join operacion_cuenta 
			on "operacion_caja"."documento_codigo" = "operacion_cuenta"."documento_codigo"
			and "operacion_caja"."documento_serie" = "operacion_cuenta"."documento_serie"
			and "operacion_caja"."nro_operacion" = "operacion_cuenta"."nro_operacion"
		LEFT OUTER JOIN "oficina" AS "oficinaOrigen" ON "operacion_caja"."oficina_origen_codigo" = "oficinaOrigen"."oficina_codigo"
		LEFT OUTER JOIN "entidad_financiera_servicios" AS "banco" ON "operacion_cuenta"."entidad_codigo" = "banco"."entidad_codigo" 
		where 
			"operacion_caja"."documento_codigo" = documento
			and "operacion_caja"."documento_serie" = serie
			and "operacion_caja"."nro_operacion" = operacion;
    END;
  $BODY$;