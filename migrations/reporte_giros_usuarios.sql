DROP FUNCTION IF EXISTS giros_por_usuario;
CREATE OR REPLACE FUNCTION giros_por_usuario(
    IN in_usuario character varying DEFAULT '*',	
	IN estado integer DEFAULT 0,
    IN fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE,
    IN fecha_final TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE
  )
  RETURNS TABLE (
	oficinaOrigen VARCHAR(20),
    oficinaDestino VARCHAR(20),
	documento_codigo VARCHAR(4),
	documento_serie INTEGER,
	nro_operacion INTEGER,
	usuario_recaudo VARCHAR(50),
    beneficiario_razon_social VARCHAR(100),
    solicitante_razon_social VARCHAR(100),
    solicitud_fecha_hora TIMESTAMP WITH TIME ZONE,
	op_documento_codigo VARCHAR(4),
	op_documento_serie INTEGER,
	op_nro_operacion INTEGER,
	op_fecha_hora TIMESTAMP WITH TIME ZONE,
	op_usuario VARCHAR(50),
	anulacion_doc_codigo VARCHAR(4),
	anulacion_doc_serie INTEGER,
	anulacion_recibo_nro INTEGER,
	anulacion_fecha_hora TIMESTAMP WITH TIME ZONE,
	anulacion_usuario VARCHAR(50),
    importe_soles DECIMAL(10, 3),
    comision_dt DECIMAL(10, 3),
    importe_dolares DECIMAL(10, 3),
    comision_banco DECIMAL(10, 3),
	otros DECIMAL(10,3),
    st_estado integer
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN
      RETURN QUERY
        select OOrig.oficina_nombre, ODest.oficina_nombre, 
		OCaj.documento_codigo, OCaj.documento_serie, OCaj.nro_operacion, OCaj.usuario,
		--Giro."St_documento_codigo", Giro."St_documento_serie", Giro."nro_Solicitud", 
		Giro.beneficiario_razon_social,Giro.solicitante_razon_social,Giro.solicitud_fecha_hora,
		Giro.op_documento_codigo, Giro.op_documento_serie, Giro.op_nro_operacion, Giro."op_fecha_hora", Giro.op_usuario, 
		RInt.anulacion_doc_codigo, RInt.anulacion_doc_serie, RInt.anulacion_recibo_nro, Giro.anulacion_fecha_hora, 
		Giro.anulacion_usuario,
		    CASE Giro."moneda"
			    WHEN '1' THEN Giro."importe":: DECIMAL(10, 3) ELSE (0.000):: DECIMAL(10, 3) END AS "importe_soles",
		      Giro."comision_dt":: DECIMAL(10, 3),
	    	CASE Giro."moneda"
			    WHEN '2' THEN Giro."importe":: DECIMAL(10, 3) ELSE (0.000):: DECIMAL(10, 3) END AS "importe_dolares",
		      COALESCE( Giro."comision_banco",(0.000):: DECIMAL(10, 3)) as "comision_banco",
			 COALESCE( Giro.gastos_administrativos,(0.000):: DECIMAL(10, 3)) as "otros",
		    Giro.st_estado 
        from operacion_caja as OCaj 		
		right outer join transferencia Giro on (Giro."St_documento_codigo"=OCaj.documento_codigo and
												 Giro."St_documento_serie"=OCaj.documento_serie and 
												  Giro."nro_Solicitud"=OCaj.nro_operacion) 
		left outer join recibo_interno RInt on (Giro."St_documento_codigo"=RInt.anulacion_doc_codigo and 
										  Giro."St_documento_serie"=RInt.anulacion_doc_serie and 
										  Giro."nro_Solicitud"=RInt.anulacion_recibo_nro)
		inner join oficina OOrig on Giro."oficina_codigo_origen"=OOrig."oficina_codigo"
		inner join oficina ODest on Giro."oficina_codigo_destino"=ODest."oficina_codigo"
		where (case when estado=1 then OCaj.usuario=in_usuario 
					when estado=2 then Giro.op_usuario=in_usuario
					when estado in (3,4) then Giro.anulacion_usuario=in_usuario
					when estado=5 then Giro.autorizacion_usuario=in_usuario else null end)
		and (case when estado=1 then Giro.st_estado in (1,2) 
				  when estado in (2,3,4) then Giro.st_estado=estado 
				  else true end)
		and (case when estado=1 then Giro.solicitud_fecha_hora BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
								AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET')
				  when estado=2 then Giro.op_fecha_hora BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
								AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') 
				  when estado in (3,4) then Giro.anulacion_fecha_hora BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
								AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') 
				  when estado=5 then Giro.autorizacion_fecha_hora BETWEEN ((DATE(fecha_inicio) + time '00:00:00')AT TIME ZONE 'PET') 
								AND ((DATE(fecha_final) + time '23:59:59')AT TIME ZONE 'PET') else null end);
	  END;
  $BODY$;