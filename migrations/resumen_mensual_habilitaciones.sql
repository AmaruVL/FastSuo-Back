DROP FUNCTION IF EXISTS resumen_mensual_habilitaciones;
CREATE OR REPLACE FUNCTION resumen_mensual_habilitaciones(
    IN oficina VARCHAR(12) DEFAULT '*',
    IN fecha_inicio timestamp with time zone DEFAULT (date_trunc('MONTH', current_date)),
    IN fecha_fin timestamp with time zone DEFAULT (date_trunc('MONTH', current_date) + INTERVAL '1 MONTH - 1 day')
  )
  RETURNS TABLE (
    habilitacion_estado TEXT,
    tipo_habilitacion VARCHAR(15),
    importe DECIMAL(10, 3),
    moneda VARCHAR(10),
    origen_oficina_codigo VARCHAR(12),
    destino_oficina_codigo VARCHAR(12),
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN
      RETURN QUERY
	  	select * 
		from (
			select 
			  CASE 
				WHEN ((DATE(fecha_fin) + time '23:59:59')AT TIME ZONE 'PET')> "hab"."updatedAt" AND "hab"."habilitacion_estado" = 'ANULADO' THEN 
				  'ANULADO'
				WHEN ((DATE(fecha_fin) + time '23:59:59')AT TIME ZONE 'PET')> "hab"."updatedAt" AND "hab"."habilitacion_estado" = 'ACEPTADO' THEN 
				  'ACEPTADO'
				ELSE 'PENDIENTE'
				END AS "habilitacion_estado",
			  hab.tipo_habilitacion,
			  hab.importe,
			  hab.moneda,
			  hab.origen_oficina_codigo,
			  hab.destino_oficina_codigo,
			  hab."createdAt",
			  hab."updatedAt"
			from habilitacion AS hab
			where (
				CASE   
					WHEN oficina != '*' THEN 
				  		hab.origen_oficina_codigo = oficina or hab.destino_oficina_codigo = oficina
					ELSE
						TRUE
				END) 
			and origen_docu_serie != 9999
			and "hab"."updatedAt" between ((DATE(fecha_inicio) + time '00:00:00') AT TIME ZONE 'PET') AND ((DATE(fecha_fin) + time '23:59:59') AT TIME ZONE 'PET')
		) as tabla1
		where tabla1.habilitacion_estado = 'ACEPTADO';
    END;
  $BODY$;