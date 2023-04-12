DROP FUNCTION IF EXISTS detalle_produccion_oficina;
CREATE OR REPLACE FUNCTION detalle_produccion_oficina(
	IN opcion_datos integer DEFAULT 0,
	IN cod_oficina VARCHAR(30) DEFAULT '*',
    IN fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE,
    IN fecha_fin TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE 
  )
  RETURNS TABLE (
    lista_fechas DATE,
	recaudados DECIMAL(7,3),
	recibidos DECIMAL(7,3),
    pagados DECIMAL(7,3),
	total_dia DECIMAL(7,3)
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN
      RETURN QUERY
   		select date(fechas) as fechas,coalesce(recaudados.total,0) recaudados,coalesce(recibidos.total,0) recibidos,
		coalesce(pagados.total,0) pagados, 
		case when cod_oficina != '*' then sum(coalesce(recaudados.total,0)+coalesce(recibidos.total,0)+coalesce(pagados.total,0)) 
			else sum(coalesce(recaudados.total,0)+coalesce(pagados.total,0)) end 
		from generate_series(fecha_inicio, fecha_fin, '1 day'::interval) fechas 
		left join 
		(select case opcion_datos when 0 then count(*) 
		   when 1 then sum(coalesce(importe,0)+coalesce(gastos_administrativos,0)) 
		   when 2 then sum(comision_dt) else null end as total,
		   date(solicitud_fecha_hora) fecha from transferencia 
		 where (CASE WHEN cod_oficina != '*' 
				THEN transferencia.oficina_codigo_origen = cod_oficina ELSE TRUE END)
		 and st_estado in (1,2)
		 group by fecha order by fecha) recaudados on fechas =recaudados.fecha
		left join 
		(select case opcion_datos when 0 then count(*) 
		   when 1 then sum(coalesce(importe,0)) 
		   when 2 then sum(comision_dt) else null end as total,
		   date(solicitud_fecha_hora) fecha from transferencia 
		 where (CASE WHEN cod_oficina != '*' 
				THEN transferencia.oficina_codigo_destino = cod_oficina ELSE TRUE END)
		 and st_estado in (1,2)
		 group by fecha order by fecha) recibidos on fechas =recibidos.fecha
		left join 
		(select case opcion_datos when 0 then count(*) 
		   when 1 then sum(coalesce(importe,0)) 
		   when 2 then sum(comision_dt) else null end as total,
		   date(op_fecha_hora) fecha from transferencia 
		 where (CASE WHEN cod_oficina != '*' 
				THEN transferencia.oficina_codigo_destino = cod_oficina ELSE TRUE END)
		 group by fecha order by fecha) pagados on fechas =pagados.fecha
		group by fechas,recaudados.total,recibidos.total,pagados.total 
		order by fechas;
  	END;
$BODY$;


DROP FUNCTION IF EXISTS detalle_produccion_usuario;
CREATE OR REPLACE FUNCTION detalle_produccion_usuario(
	IN opcion_datos integer DEFAULT 0,
	IN cod_usuario VARCHAR(200) DEFAULT NULL,
    IN fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE,
    IN fecha_fin TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE 
  )
  RETURNS TABLE (
    lista_fechas DATE,
	recaudados DECIMAL(7,3),
    pagados DECIMAL(7,3),
	total_dia DECIMAL(7,3)
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN
      RETURN QUERY
   		select date(fechas) as fechas,coalesce(recaudados.total,0) recaudados,
		coalesce(pagados.total,0) pagados, sum(coalesce(recaudados.total,0)+coalesce(pagados.total,0))
		from generate_series(fecha_inicio, fecha_fin, '1 day'::interval) fechas 
		left join 
		(select case opcion_datos when 0 then count(*) 
		   when 1 then sum(coalesce(importe,0)+coalesce(gastos_administrativos,0)) 
		   when 2 then sum(comision_dt) else null end as total,
		   date(solicitud_fecha_hora) fecha from transferencia 
		 inner join operacion_caja OCaj on transferencia."St_documento_codigo"=OCaj.documento_codigo and
		 transferencia."St_documento_serie"=OCaj.documento_serie and transferencia."nro_Solicitud"=OCaj.nro_operacion 
		 where OCaj.usuario=cod_usuario and st_estado in (1,2)
		 group by fecha order by fecha) recaudados on fechas =recaudados.fecha
		left join 
		(select case opcion_datos when 0 then count(*) 
		   when 1 then sum(coalesce(importe,0)) 
		   when 2 then sum(comision_dt) else null end as total,
		   date(op_fecha_hora) fecha from transferencia 
		 inner join operacion_caja OCaj on transferencia."op_documento_codigo"=OCaj.documento_codigo and
		 transferencia."op_documento_serie"=OCaj.documento_serie and transferencia."op_nro_operacion"=OCaj.nro_operacion 
		 where OCaj.usuario=cod_usuario 
		 group by fecha order by fecha) pagados on fechas =pagados.fecha
		group by fechas,recaudados.total,pagados.total 
		order by fechas;
  	END;
$BODY$;