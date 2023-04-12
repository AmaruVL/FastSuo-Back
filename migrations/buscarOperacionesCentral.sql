DROP FUNCTION IF EXISTS buscar_operaciones_central;
CREATE OR REPLACE FUNCTION buscar_operaciones_central(
    IN usuario VARCHAR(20),
    IN fechaTrabajo DATE
  )
  RETURNS TABLE (
    "id" INTEGER,
    "fecha_registro" TIMESTAMP WITH TIME ZONE,
    "texto1" TEXT,
    "texto2" TEXT,
    "texto3" TEXT,
    "usuario_registro" VARCHAR(20),
    "tipo" VARCHAR(100),
    "leido" BOOLEAN
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN
      RETURN QUERY
		select  n.id, n.fecha_registro, n.texto1 , n.texto2 ,n.texto3 ,n.usuario_registro ,n.tipo , usuario_notificacion.leido 
		from notificacion n 
		inner join usuario_notificacion on n.id = usuario_notificacion.id_notificacion 
		where usuario_notificacion.id_usuario = usuario and n.fecha_registro > ((DATE(fechaTrabajo) + time '00:00:00')AT TIME ZONE 'PET')
    order by n.fecha_registro desc;
	END;
  $BODY$;