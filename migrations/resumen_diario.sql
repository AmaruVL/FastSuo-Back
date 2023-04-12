DROP FUNCTION IF EXISTS resumen_diario;
CREATE OR REPLACE FUNCTION resumen_diario(
	IN caja_cod character varying,
    IN fecha timestamp with time zone
)
RETURNS TABLE (
	documento_cod character varying,
	modulo_doc character varying,
	imp_soles numeric,
	dtSoles numeric,
	imp_dolares numeric,
	dtDolares numeric,
	dtBanco numeric
)
LANGUAGE 'plpgsql'    
  AS $BODY$
    BEGIN  
		RETURN QUERY
		select documento_codigo,modulo,coalesce(sum(importe_soles),0)as importe_soles,
		coalesce(sum(dt_soles),0) as dt_soles,coalesce(sum(importe_dolares),0) as importe_dolares,
		coalesce(sum(dt_dolares),0) as dt_dolares,coalesce(sum(banco),0) as dt_banco
		from (
			select documento_codigo,
			case moneda
			when '1' then sum("transferencia"."importe") end as importe_soles,
			case moneda 
			when '1' then sum("transferencia"."comision_dt") end as dt_soles,
			case moneda 
			when '2' then sum("transferencia"."importe") end as importe_dolares,
			case moneda
			when '2' then sum("transferencia"."comision_dt") end as dt_dolares,
			coalesce(sum("transferencia"."comision_banco"),0)as banco,modulo 
			from operacion_caja "OCaj" 
			right outer join transferencia on (documento_codigo="transferencia"."St_documento_codigo" and 
			documento_serie="transferencia"."St_documento_serie" and nro_operacion="transferencia"."nro_Solicitud"
			or documento_codigo="transferencia"."op_documento_codigo" and documento_serie="transferencia"."op_documento_serie" 
			and nro_operacion="transferencia"."op_nro_operacion") 
			where date(fecha_hora_operacion)=fecha and caja_codigo=caja_cod
			group by documento_codigo,modulo,moneda)t1
		group by documento_codigo,modulo
		union all
		select recibo_doc_codigo,recibo_tipo,coalesce(sum(importe_soles),0) as importe_soles,0 as dt_soles,
		coalesce(sum(importe_dolares),0) as importe_dolares,0 as dt_dolares,0 as dt_banco from(
		select recibo_doc_codigo,recibo_tipo,
		case moneda
			when '1' then sum(importe)
			when 'SOLES' then sum(importe)
			end as importe_soles,
		case moneda
			when '2' then sum(importe)
			when 'DOLARES' then sum(importe)
			end as importe_dolares	
		from recibo_interno
			left outer join operacion_caja on recibo_doc_codigo=documento_codigo
			and recibo_doc_serie=documento_serie and recibo_nro=nro_operacion
		where date(recibo_fecha_hora)=fecha and "operacion_caja"."caja_codigo"=caja_cod
		group by recibo_doc_codigo,recibo_tipo,moneda)t1
		group by recibo_doc_codigo,recibo_tipo;
	END;
$BODY$;