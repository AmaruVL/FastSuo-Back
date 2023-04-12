drop function if exists reportes_obtener_saldos_por_empresa(
	character varying,
	timestamp with time zone,
	timestamp with time zone
);
drop function if exists reportes_anulados_extornados_por_empresa(
	character varying,
	character varying,
	character varying,
	character varying,
	timestamp with time zone,
	timestamp with time zone
);
drop function if exists reportes_ordenpago_por_empresa(
	character varying,
	character varying,
	timestamp with time zone,
	timestamp with time zone
);
drop function if exists reportes_transferencia_por_empresa(
	character varying,
	character varying,
	timestamp with time zone,
	timestamp with time zone
);

drop function if exists reportes_obtener_saldos_por_oficina(
	character varying,
	timestamp with time zone,
	timestamp with time zone
);
drop function if exists reportes_anulados_extornados_por_oficina(
	character varying,
	character varying,
	character varying,
	character varying,
	timestamp with time zone,
	timestamp with time zone
);
drop function if exists reportes_ordenpago_por_oficina(
	character varying,
	character varying,
	timestamp with time zone,
	timestamp with time zone
);
drop function if exists reportes_transferencia_por_oficina(
	character varying,
	character varying,
	timestamp with time zone,
	timestamp with time zone
);


drop function if exists reportes_obtener_saldos(
	character varying,
	date,
	date
);
drop function if exists reportes_anulados_extornados(
	character varying,
	character varying,
	character varying,
	character varying,
	date,
	date
);
drop function if exists reportes_orden_pago(
	character varying,
	character varying,
	date,
	date
);
drop function if exists reportes_transferencia(
	character varying,
	character varying,
	timestamp with time zone,
	timestamp with time zone
);




CREATE OR REPLACE FUNCTION reportes_obtener_saldos_por_empresa(
	in in_codigo_empresa character varying,
	in in_fecha_inicio timestamp with time zone,
	in in_fecha_final timestamp with time zone,
	out out_oficina_nombre character varying,
	out out_saldo1_anterior numeric,
	out out_saldo2_anterior numeric,
	out out_saldo3_anterior numeric,
	out out_saldo1_final numeric,
	out out_saldo2_final numeric,
	out out_saldo3_final numeric
)
RETURNS SETOF record AS
    $BODY$
    declare
     reg RECORD;
    BEGIN
		drop table if exists tmp_tabla1;
		CREATE LOCAL TEMP TABLE tmp_tabla1 as(
			select 
				oficina_codigo,
				oficina_nombre
			from 
				oficina
				where 
					empresa_codigo = in_codigo_empresa
		);
		drop table if exists tmp_tabla2;
		CREATE TEMP TABLE tmp_tabla2 as(
			select
				COALESCE(SUM("moneda1_Ingre")- SUM("moneda1_Egre"),0) AS "saldo1_anterior",
				COALESCE(SUM("moneda2_Ingre")- SUM("moneda2_Egre"),0) AS "saldo2_anterior",
				COALESCE(SUM("moneda3_Ingre")- SUM("moneda3_Egre"),0) AS "saldo3_anterior"
				from 
					operacion_caja tabla1,
					tmp_tabla1 tabla2
				where 
					tabla1.oficina_origen_codigo = tabla2.oficina_codigo and
					tabla1.fecha_hora_operacion BETWEEN in_fecha_inicio+ interval '-24 hours' AND in_fecha_final
		);
		drop table if exists tmp_tabla3;
		CREATE TEMP TABLE tmp_tabla3 as(
			select
				COALESCE(SUM("moneda1_Ingre")- SUM("moneda1_Egre"),0) AS "saldo1_final",
				COALESCE(SUM("moneda2_Ingre")- SUM("moneda2_Egre"),0) AS "saldo2_final",
				COALESCE(SUM("moneda3_Ingre")- SUM("moneda3_Egre"),0) AS "saldo3_final"
				from 
					operacion_caja tabla1,
					tmp_tabla1 tabla2
				where 
					tabla1.oficina_origen_codigo = tabla2.oficina_codigo and
					tabla1.fecha_hora_operacion BETWEEN in_fecha_inicio AND in_fecha_final
		);
     	FOR reg IN
     		Select
				tabla3.razon_social,
				tabla1.saldo1_anterior,
				tabla1.saldo2_anterior,
				tabla1.saldo3_anterior,
				tabla2.saldo1_final,
				tabla2.saldo2_final,
				tabla2.saldo3_final
			from 
				tmp_tabla2 tabla1, 
				tmp_tabla3 tabla2,
				empresa tabla3
			where
				tabla3.empresa_codigo = in_codigo_empresa
     	loop
	 		out_oficina_nombre:= reg.razon_social;
			out_saldo1_anterior := reg.saldo1_anterior;
			out_saldo2_anterior := reg.saldo2_anterior;
			out_saldo3_anterior := reg.saldo3_anterior;
			out_saldo1_final := reg.saldo1_final;
			out_saldo2_final := reg.saldo2_final;
			out_saldo3_final := reg.saldo3_final;
       	return next;
     end loop;
	 return;
END;
$BODY$
LANGUAGE plpgsql VOLATILE;


CREATE OR REPLACE FUNCTION reportes_anulados_extornados_por_empresa(
	in in_codigo_empresa character varying,
	in in_modulo_uno character varying,
	in in_modulo_dos character varying,
	in in_estado character varying,
	in in_fecha_inicio timestamp with time zone,
	in in_fecha_final timestamp with time zone,
	out out_numero_transac integer,
	out out_codigo_serie_nro character varying,
	out out_recibo_concepto character varying,
	out out_cliente_rs character varying,
	out out_moneda1_ingre numeric,
	out out_moneda1_egre numeric,
	out out_moneda2_ingre numeric,
	out out_moneda2_egre numeric,
	out out_moneda3_ingre numeric,
	out out_moneda3_egre numeric
)
RETURNS SETOF record AS
    $BODY$
    declare
     reg RECORD;
    BEGIN
		drop table if exists tmp_tabla1;
		CREATE LOCAL TEMP TABLE tmp_tabla1 as(
			select 
				oficina_codigo,
				oficina_nombre
			from 
				oficina
				where 
					empresa_codigo = in_codigo_empresa
		);
		drop table if exists tmp_tabla2;
		CREATE TEMP TABLE tmp_tabla2 as(
			select * from 
				operacion_caja tabla1,
				tmp_tabla1 tabla2
				where 
					tabla1.oficina_origen_codigo = tabla2.oficina_codigo and
					(tabla1.modulo = in_modulo_uno OR 
					 tabla1.modulo = in_modulo_dos) and
					tabla1.fecha_hora_operacion BETWEEN in_fecha_inicio AND in_fecha_final
		);
     	FOR reg IN
     		Select
				tabla1.nro_transaccion_dia,
		   		coalesce(tabla2.recibo_doc_codigo||'-'||
						 tabla2.recibo_doc_serie||'-'||
						 tabla2.recibo_nro) as codigo_serie_nro,
				tabla2.recibo_concepto,
				tabla1.cliente_razon_social,
				tabla1."moneda1_Ingre",
				tabla1."moneda1_Egre",
				tabla1."moneda2_Ingre",
				tabla1."moneda2_Egre",
				tabla1."moneda3_Ingre",
				tabla1."moneda3_Egre"
			from 
				tmp_tabla2 tabla1, 
				recibo_interno tabla2
			where
				tabla1.documento_codigo = tabla2.recibo_doc_codigo and
				tabla1.documento_serie = tabla2.recibo_doc_serie and
				tabla1.nro_operacion = tabla2.recibo_nro and
				tabla2.recibo_concepto like in_estado||'%'
     	loop
	 		out_numero_transac := reg.nro_transaccion_dia;
			out_codigo_serie_nro := reg.codigo_serie_nro;
			out_recibo_concepto := reg.recibo_concepto;
			out_cliente_rs := reg.cliente_razon_social;
			out_moneda1_ingre := reg."moneda1_Ingre";
			out_moneda1_egre := reg."moneda1_Egre";
			out_moneda2_ingre := reg."moneda2_Ingre";
			out_moneda2_egre := reg."moneda2_Egre";
			out_moneda3_ingre := reg."moneda3_Ingre";
			out_moneda3_egre := reg."moneda3_Egre";
       	return next;
     end loop;
	 return;
END;
$BODY$
LANGUAGE plpgsql VOLATILE;

CREATE OR REPLACE FUNCTION reportes_ordenpago_por_empresa(
	in in_codigo_empresa character varying,
	in in_modulo character varying,
	in in_fecha_inicio timestamp with time zone,
	in in_fecha_final timestamp with time zone,
	out out_numero_transac integer,
	out out_oficina_nombre character varying,
	out out_nro_transac integer,
	out out_beneficiario_rs character varying,
	out out_solicitante_rs character varying,
	out out_importe numeric,
	out out_suma_importe numeric,
	out out_comision_dt numeric,
	out out_suma_comision_dt numeric,
	out out_st_estado character
)
      RETURNS SETOF record AS
    $BODY$
    declare
     reg RECORD;
    BEGIN
		drop table if exists tmp_tabla1;
		CREATE LOCAL TEMP TABLE tmp_tabla1 as(
			select 
				oficina_codigo,
				oficina_nombre
			from 
				oficina
				where 
					empresa_codigo = in_codigo_empresa
		);
		drop table if exists tmp_tabla2;
		CREATE TEMP TABLE tmp_tabla2 as(
			select * from 
				operacion_caja tabla1,
				tmp_tabla1 tabla2
				where 
					tabla1.oficina_origen_codigo = tabla2.oficina_codigo and
					tabla1.modulo = in_modulo and
					tabla1.fecha_hora_operacion BETWEEN in_fecha_inicio AND in_fecha_final
		);
     	FOR reg IN
     		Select
		   		tabla1.nro_transaccion_dia,
				tabla3.oficina_nombre,
				tabla1.nro_transaccion,
				tabla2.beneficiario_razon_social,
				tabla2.solicitante_razon_social,
				tabla2.importe,
				sum(sum(tabla2.importe)) over(order by tabla1.nro_transaccion_dia asc) as suma_importe,
				tabla2.comision_dt,
				sum(sum(tabla2.comision_dt)) over(order by tabla1.nro_transaccion_dia asc) as suma_comision_dt,
				CASE st_estado
					WHEN 1 THEN 'PENDIENTE'
					WHEN 2 THEN 'PAGADO'
					WHEN 3 THEN 'ANULADO'
					WHEN 4 THEN 'EXTORNADO'
					ELSE 'Otro Caso'
				END as st_estado
			from 
				tmp_tabla2 tabla1, 
				transferencia tabla2,
				oficina tabla3
			where
				tabla1.documento_codigo = tabla2.op_documento_codigo and
				tabla1.documento_serie = tabla2.op_documento_serie and
				tabla1.nro_operacion = tabla2.op_nro_operacion and
				tabla2.oficina_codigo_origen = tabla3.oficina_codigo and
				tabla2.st_estado = 2
			group by
				tabla1.nro_transaccion_dia,
				tabla3.oficina_nombre,
				tabla1.nro_transaccion,
				tabla2.beneficiario_razon_social,
				tabla2.solicitante_razon_social,
				tabla2.importe,
				tabla2.comision_dt,
				tabla2.st_estado
     	loop
	 		out_numero_transac := reg.nro_transaccion_dia;
			out_oficina_nombre := reg.oficina_nombre;
			out_nro_transac := reg.nro_transaccion;
			out_beneficiario_rs := reg.beneficiario_razon_social;
			out_solicitante_rs := reg.solicitante_razon_social;
			out_importe := reg.importe;
			out_suma_importe := reg.suma_importe;
			out_comision_dt := reg.comision_dt;
			out_suma_comision_dt := reg.suma_comision_dt;
			out_st_estado := reg.st_estado;
       	return next;
     end loop;
	 return;
END;
$BODY$
LANGUAGE plpgsql VOLATILE;

CREATE OR REPLACE FUNCTION reportes_transferencia_por_empresa(
	in in_codigo_empresa character varying,
	in in_modulo character varying,
	in in_fecha_inicio timestamp with time zone,
	in in_fecha_final timestamp with time zone,
	out out_numero_transac integer,
	out out_oficina_nombre character varying,
	out out_nro_transac integer,
	out out_beneficiario_rs character varying,
	out out_solicitante_rs character varying,
	out out_importe numeric,
	out out_suma_importe numeric,
	out out_comision_dt numeric,
	out out_suma_comision_dt numeric,
	out out_st_estado character
)
      RETURNS SETOF record AS
    $BODY$
    declare
     reg RECORD;
    BEGIN
		drop table if exists tmp_tabla1;
		CREATE LOCAL TEMP TABLE tmp_tabla1 as(
			select 
				oficina_codigo,
				oficina_nombre
			from 
				oficina
				where 
					empresa_codigo = in_codigo_empresa
		);
		drop table if exists tmp_tabla2;
		CREATE LOCAL TEMP TABLE tmp_tabla2 as(
			select * 
				from 
					operacion_caja tabla1,
					tmp_tabla1 tabla2
				where 
					tabla1.oficina_origen_codigo = tabla2.oficina_codigo and
					tabla1.modulo = in_modulo and
					tabla1.fecha_hora_operacion BETWEEN in_fecha_inicio AND in_fecha_final
		);
     	FOR reg IN
     		Select
		   		tabla1.nro_transaccion_dia,
				tabla3.oficina_nombre,
				tabla1.nro_transaccion,
				tabla2.beneficiario_razon_social,
				tabla2.solicitante_razon_social,
				tabla2.importe,
				sum(sum(tabla2.importe)) over(order by tabla1.nro_transaccion_dia asc) as suma_importe,
				tabla2.comision_dt,
				sum(sum(tabla2.comision_dt)) over(order by tabla1.nro_transaccion_dia asc) as suma_comision_dt,
				CASE st_estado
					WHEN 1 THEN 'PENDIENTE'
					WHEN 2 THEN 'PAGADO'
					WHEN 3 THEN 'ANULADO'
					WHEN 4 THEN 'EXTORNADO'
					ELSE 'Otro Caso'
				END as st_estado
			from 
				tmp_tabla2 tabla1, 
				transferencia tabla2,
				oficina tabla3
			where
				tabla1.documento_codigo = tabla2."St_documento_codigo" and
				tabla1.documento_serie = tabla2."St_documento_serie" and
				tabla1.nro_operacion = tabla2."nro_Solicitud" and
				tabla2.oficina_codigo_origen = tabla3.oficina_codigo and
				(tabla2.st_estado = 1 or
				tabla2.st_estado = 2)		
			group by
				tabla1.nro_transaccion_dia,
				tabla3.oficina_nombre,
				tabla1.nro_transaccion,
				tabla2.beneficiario_razon_social,
				tabla2.solicitante_razon_social,
				tabla2.importe,
				tabla2.comision_dt,
				tabla2.st_estado
     	loop
	 		out_numero_transac := reg.nro_transaccion_dia;
			out_oficina_nombre := reg.oficina_nombre;
			out_nro_transac := reg.nro_transaccion;
			out_beneficiario_rs := reg.beneficiario_razon_social;
			out_solicitante_rs := reg.solicitante_razon_social;
			out_importe := reg.importe;
			out_suma_importe := reg.suma_importe;
			out_comision_dt := reg.comision_dt;
			out_suma_comision_dt := reg.suma_comision_dt;
			out_st_estado := reg.st_estado;
       	return next;
     end loop;
	 return;
END;
$BODY$
LANGUAGE plpgsql VOLATILE;

CREATE OR REPLACE FUNCTION reportes_obtener_saldos_por_oficina(
	in in_codigo_oficina character varying,
	in in_fecha_inicio timestamp with time zone,
	in in_fecha_final timestamp with time zone,
	out out_oficina_nombre character varying,
	out out_saldo1_anterior numeric,
	out out_saldo2_anterior numeric,
	out out_saldo3_anterior numeric,
	out out_saldo1_final numeric,
	out out_saldo2_final numeric,
	out out_saldo3_final numeric
)
RETURNS SETOF record AS
    $BODY$
    declare
     reg RECORD;
    BEGIN
		drop table if exists tmp_tabla1;
		CREATE TEMP TABLE tmp_tabla1 as(
			select
				COALESCE(SUM("moneda1_Ingre")- SUM("moneda1_Egre"),0) AS "saldo1_anterior",
				COALESCE(SUM("moneda2_Ingre")- SUM("moneda2_Egre"),0) AS "saldo2_anterior",
				COALESCE(SUM("moneda3_Ingre")- SUM("moneda3_Egre"),0) AS "saldo3_anterior"
				from operacion_caja
				where 
					oficina_origen_codigo = in_codigo_oficina and
					fecha_hora_operacion BETWEEN in_fecha_inicio+ interval '-24 hours' AND in_fecha_final
			
		);
		
		drop table if exists tmp_tabla2;
		CREATE TEMP TABLE tmp_tabla2 as(
			select
				COALESCE(SUM("moneda1_Ingre")- SUM("moneda1_Egre"),0) AS "saldo1_final",
				COALESCE(SUM("moneda2_Ingre")- SUM("moneda2_Egre"),0) AS "saldo2_final",
				COALESCE(SUM("moneda3_Ingre")- SUM("moneda3_Egre"),0) AS "saldo3_final"
				from operacion_caja
				where 
					oficina_origen_codigo = in_codigo_oficina and
					fecha_hora_operacion BETWEEN in_fecha_inicio AND in_fecha_final
		);
     	FOR reg IN
     		Select
				tabla3.oficina_nombre,
				tabla1.saldo1_anterior,
				tabla1.saldo2_anterior,
				tabla1.saldo3_anterior,
				tabla2.saldo1_final,
				tabla2.saldo2_final,
				tabla2.saldo3_final
			from 
				tmp_tabla1 tabla1, 
				tmp_tabla2 tabla2,
				oficina tabla3
			where
				tabla3.oficina_codigo = in_codigo_oficina
     	loop
	 		out_oficina_nombre:= reg.oficina_nombre;
			out_saldo1_anterior := reg.saldo1_anterior;
			out_saldo2_anterior := reg.saldo2_anterior;
			out_saldo3_anterior := reg.saldo3_anterior;
			out_saldo1_final := reg.saldo1_final;
			out_saldo2_final := reg.saldo2_final;
			out_saldo3_final := reg.saldo3_final;
       	return next;
     end loop;
	 return;
END;
$BODY$
LANGUAGE plpgsql VOLATILE;

CREATE OR REPLACE FUNCTION reportes_anulados_extornados_por_oficina(
	in in_codigo_oficina character varying,
	in in_modulo_uno character varying,
	in in_modulo_dos character varying,
	in in_estado character varying,
	in in_fecha_inicio timestamp with time zone,
	in in_fecha_final timestamp with time zone,
	out out_numero_transac integer,
	out out_codigo_serie_nro character varying,
	out out_recibo_concepto character varying,
	out out_cliente_rs character varying,
	out out_moneda1_ingre numeric,
	out out_moneda1_egre numeric,
	out out_moneda2_ingre numeric,
	out out_moneda2_egre numeric,
	out out_moneda3_ingre numeric,
	out out_moneda3_egre numeric
)
RETURNS SETOF record AS
    $BODY$
    declare
     reg RECORD;
    BEGIN
		drop table if exists tmp_tabla1;
		CREATE TEMP TABLE tmp_tabla1 as(
			select * from operacion_caja
				where 
					oficina_origen_codigo = in_codigo_oficina and
					(modulo = in_modulo_uno OR 
					 modulo = in_modulo_dos) and
					fecha_hora_operacion BETWEEN in_fecha_inicio AND in_fecha_final
		);
     	FOR reg IN
     		Select
				tabla1.nro_transaccion_dia,
		   		coalesce(tabla2.recibo_doc_codigo||'-'||
						 tabla2.recibo_doc_serie||'-'||
						 tabla2.recibo_nro) as codigo_serie_nro,
				tabla2.recibo_concepto,
				tabla1.cliente_razon_social,
				tabla1."moneda1_Ingre",
				tabla1."moneda1_Egre",
				tabla1."moneda2_Ingre",
				tabla1."moneda2_Egre",
				tabla1."moneda3_Ingre",
				tabla1."moneda3_Egre"
			from 
				tmp_tabla1 tabla1, 
				recibo_interno tabla2
			where
				tabla1.documento_codigo = tabla2.recibo_doc_codigo and
				tabla1.documento_serie = tabla2.recibo_doc_serie and
				tabla1.nro_operacion = tabla2.recibo_nro and
				tabla2.recibo_concepto like in_estado||'%'
     	loop
	 		out_numero_transac := reg.nro_transaccion_dia;
			out_codigo_serie_nro := reg.codigo_serie_nro;
			out_recibo_concepto := reg.recibo_concepto;
			out_cliente_rs := reg.cliente_razon_social;
			out_moneda1_ingre := reg."moneda1_Ingre";
			out_moneda1_egre := reg."moneda1_Egre";
			out_moneda2_ingre := reg."moneda2_Ingre";
			out_moneda2_egre := reg."moneda2_Egre";
			out_moneda3_ingre := reg."moneda3_Ingre";
			out_moneda3_egre := reg."moneda3_Egre";
       	return next;
     end loop;
	 return;
END;
$BODY$
LANGUAGE plpgsql VOLATILE;

CREATE OR REPLACE FUNCTION reportes_ordenpago_por_oficina(
	in in_oficina_codigo character varying,
	in in_modulo character varying,
	in in_fecha_inicio timestamp with time zone,
	in in_fecha_final timestamp with time zone,
	out out_numero_transac integer,
	out out_oficina_nombre character varying,
	out out_nro_transac integer,
	out out_beneficiario_rs character varying,
	out out_solicitante_rs character varying,
	out out_importe numeric,
	out out_suma_importe numeric,
	out out_comision_dt numeric,
	out out_suma_comision_dt numeric,
	out out_st_estado character
)
      RETURNS SETOF record AS
    $BODY$
    declare
     reg RECORD;
    BEGIN
		drop table if exists tmp_tabla1;
		CREATE TEMP TABLE tmp_tabla1 as(
			select * from operacion_caja
				where 
					oficina_origen_codigo = in_oficina_codigo and
					modulo = in_modulo and
					fecha_hora_operacion BETWEEN in_fecha_inicio AND in_fecha_final
		);
     	FOR reg IN
     		Select
		   		tabla1.nro_transaccion_dia,
				tabla3.oficina_nombre,
				tabla1.nro_transaccion,
				tabla2.beneficiario_razon_social,
				tabla2.solicitante_razon_social,
				tabla2.importe,
				sum(sum(tabla2.importe)) over(order by tabla1.nro_transaccion_dia asc) as suma_importe,
				tabla2.comision_dt,
				sum(sum(tabla2.comision_dt)) over(order by tabla1.nro_transaccion_dia asc) as suma_comision_dt,
				CASE st_estado
					WHEN 1 THEN 'PENDIENTE'
					WHEN 2 THEN 'PAGADO'
					WHEN 3 THEN 'ANULADO'
					WHEN 4 THEN 'EXTORNADO'
					ELSE 'Otro Caso'
				END as st_estado
			from 
				tmp_tabla1 tabla1, 
				transferencia tabla2,
				oficina tabla3
			where
				tabla1.documento_codigo = tabla2.op_documento_codigo and
				tabla1.documento_serie = tabla2.op_documento_serie and
				tabla1.nro_operacion = tabla2.op_nro_operacion and
				tabla2.oficina_codigo_origen = tabla3.oficina_codigo and
				tabla2.st_estado = 2
			group by
				tabla1.nro_transaccion_dia,
				tabla3.oficina_nombre,
				tabla1.nro_transaccion,
				tabla2.beneficiario_razon_social,
				tabla2.solicitante_razon_social,
				tabla2.importe,
				tabla2.comision_dt,
				tabla2.st_estado
     	loop
	 		out_numero_transac := reg.nro_transaccion_dia;
			out_oficina_nombre := reg.oficina_nombre;
			out_nro_transac := reg.nro_transaccion;
			out_beneficiario_rs := reg.beneficiario_razon_social;
			out_solicitante_rs := reg.solicitante_razon_social;
			out_importe := reg.importe;
			out_suma_importe := reg.suma_importe;
			out_comision_dt := reg.comision_dt;
			out_suma_comision_dt := reg.suma_comision_dt;
			out_st_estado := reg.st_estado;
       	return next;
     end loop;
	 return;
END;
$BODY$
LANGUAGE plpgsql VOLATILE;

CREATE OR REPLACE FUNCTION reportes_transferencia_por_oficina(
	in in_codigo_oficina character varying,
	in in_modulo character varying,
	in in_fecha_inicio timestamp with time zone,
	in in_fecha_final timestamp with time zone,
	out out_oficina_nombre character varying,
	out out_nro_transac integer,
	out out_beneficiario_rs character varying,
	out out_solicitante_rs character varying,
	out out_importe numeric,
	out out_suma_importe numeric,
	out out_comision_dt numeric,
	out out_suma_comision_dt numeric,
	out out_st_estado character
)
      RETURNS SETOF record AS
    $BODY$
    declare
     reg RECORD;
    BEGIN
     	FOR reg IN
     		Select
				tabla2.oficina_nombre,
				tabla1."nro_Solicitud",
				tabla1.beneficiario_razon_social,
				tabla1.solicitante_razon_social,
				tabla1.importe,
				sum(sum(tabla1.importe)) over(order by tabla1."nro_Solicitud" asc) as suma_importe,
				tabla1.comision_dt,
				sum(sum(tabla1.comision_dt)) over(order by tabla1."nro_Solicitud" asc) as suma_comision_dt,
				CASE st_estado
					WHEN 1 THEN 'PENDIENTE'
					WHEN 2 THEN 'PAGADO'
					WHEN 3 THEN 'ANULADO'
					WHEN 4 THEN 'EXTORNADO'
					ELSE 'Otro Caso'
				END as st_estado
			from
				transferencia tabla1,
				oficina tabla2
			where
				tabla1.oficina_codigo_destino = in_codigo_oficina and
				tabla1.oficina_codigo_origen = tabla2.oficina_codigo and
				tabla1.solicitud_fecha_hora BETWEEN in_fecha_inicio AND in_fecha_final
			group by
				tabla2.oficina_nombre,
				tabla1."nro_Solicitud",
				tabla1.beneficiario_razon_social,
				tabla1.solicitante_razon_social,
				tabla1.importe,
				tabla1.comision_dt,
				tabla1.st_estado
     	loop
			out_oficina_nombre := reg.oficina_nombre;
			out_nro_transac := reg."nro_Solicitud";
			out_beneficiario_rs := reg.beneficiario_razon_social;
			out_solicitante_rs := reg.solicitante_razon_social;
			out_importe := reg.importe;
			out_suma_importe := reg.suma_importe;
			out_comision_dt := reg.comision_dt;
			out_suma_comision_dt := reg.suma_comision_dt;
			out_st_estado := reg.st_estado;
       	return next;
     end loop;
	 return;
END;
$BODY$
LANGUAGE plpgsql VOLATILE;

CREATE OR REPLACE FUNCTION reportes_obtener_saldos(
	in in_codigo_caja character varying,
	in in_fecha_inicio date,
	in in_fecha_final date,
	out out_caja_nombre character varying,
	out out_saldo1_anterior numeric,
	out out_saldo2_anterior numeric,
	out out_saldo3_anterior numeric,
	out out_saldo1_final numeric,
	out out_saldo2_final numeric,
	out out_saldo3_final numeric
)
RETURNS SETOF record AS
    $BODY$
    declare
     reg RECORD;
	 var ALIAS FOR $2;
    BEGIN
		drop table if exists tmp_tabla1;
		CREATE TEMP TABLE tmp_tabla1 as(
			select
				COALESCE(SUM("moneda1_Ingre")- SUM("moneda1_Egre"),0) AS "saldo1_anterior",
				COALESCE(SUM("moneda2_Ingre")- SUM("moneda2_Egre"),0) AS "saldo2_anterior",
				COALESCE(SUM("moneda3_Ingre")- SUM("moneda3_Egre"),0) AS "saldo3_anterior"
				from operacion_caja
				where 
					caja_codigo = in_codigo_caja and
					fecha_trabajo = in_fecha_inicio+ integer '-1'
		);
		
		drop table if exists tmp_tabla2;
		CREATE TEMP TABLE tmp_tabla2 as(
			select
				COALESCE(SUM("moneda1_Ingre")- SUM("moneda1_Egre"),0) AS "saldo1_final",
				COALESCE(SUM("moneda2_Ingre")- SUM("moneda2_Egre"),0) AS "saldo2_final",
				COALESCE(SUM("moneda3_Ingre")- SUM("moneda3_Egre"),0) AS "saldo3_final"
				from operacion_caja
				where 
					caja_codigo = in_codigo_caja and
					fecha_trabajo BETWEEN in_fecha_inicio AND in_fecha_final
		);
     	FOR reg IN
     		Select
				tabla3.caja_nombre,
				tabla1.saldo1_anterior,
				tabla1.saldo2_anterior,
				tabla1.saldo3_anterior,
				tabla2.saldo1_final,
				tabla2.saldo2_final,
				tabla2.saldo3_final
			from 
				tmp_tabla1 tabla1, 
				tmp_tabla2 tabla2,
				caja tabla3
			where
				tabla3.caja_codigo = in_codigo_caja
     	loop
	 		out_caja_nombre:= reg.caja_nombre;
			out_saldo1_anterior := reg.saldo1_anterior;
			out_saldo2_anterior := reg.saldo2_anterior;
			out_saldo3_anterior := reg.saldo3_anterior;
			out_saldo1_final := reg.saldo1_final;
			out_saldo2_final := reg.saldo2_final;
			out_saldo3_final := reg.saldo3_final;
       	return next;
     end loop;
	 return;
END;
$BODY$
LANGUAGE plpgsql VOLATILE;

CREATE OR REPLACE FUNCTION reportes_anulados_extornados(
	in in_codigo_caja character varying,
	in in_modulo_uno character varying,
	in in_modulo_dos character varying,
	in in_estado character varying,
	in in_fecha_inicio date,
	in in_fecha_final date,
	out out_numero_transac integer,
	out out_codigo_serie_nro character varying,
	out out_recibo_concepto character varying,
	out out_cliente_rs character varying,
	out out_moneda1_ingre numeric,
	out out_moneda1_egre numeric,
	out out_moneda2_ingre numeric,
	out out_moneda2_egre numeric,
	out out_moneda3_ingre numeric,
	out out_moneda3_egre numeric
)
RETURNS SETOF record AS
    $BODY$
    declare
     reg RECORD;
    BEGIN
		drop table if exists tmp_tabla1;
		CREATE TEMP TABLE tmp_tabla1 as(
			select * from operacion_caja
				where 
					caja_codigo = in_codigo_caja and
					(modulo = in_modulo_uno OR 
					 modulo = in_modulo_dos) and
					fecha_trabajo BETWEEN in_fecha_inicio AND in_fecha_final
		);
     	FOR reg IN
     		Select
				tabla1.nro_transaccion_dia,
		   		coalesce(tabla2.recibo_doc_codigo||'-'||
						 tabla2.recibo_doc_serie||'-'||
						 tabla2.recibo_nro) as codigo_serie_nro,
				tabla2.recibo_concepto,
				tabla1.cliente_razon_social,
				tabla1."moneda1_Ingre",
				tabla1."moneda1_Egre",
				tabla1."moneda2_Ingre",
				tabla1."moneda2_Egre",
				tabla1."moneda3_Ingre",
				tabla1."moneda3_Egre"
			from 
				tmp_tabla1 tabla1, 
				recibo_interno tabla2
			where
				tabla1.documento_codigo = tabla2.recibo_doc_codigo and
				tabla1.documento_serie = tabla2.recibo_doc_serie and
				tabla1.nro_operacion = tabla2.recibo_nro and
				tabla2.recibo_concepto like in_estado||'%'
     	loop
	 		out_numero_transac := reg.nro_transaccion_dia;
			out_codigo_serie_nro := reg.codigo_serie_nro;
			out_recibo_concepto := reg.recibo_concepto;
			out_cliente_rs := reg.cliente_razon_social;
			out_moneda1_ingre := reg."moneda1_Ingre";
			out_moneda1_egre := reg."moneda1_Egre";
			out_moneda2_ingre := reg."moneda2_Ingre";
			out_moneda2_egre := reg."moneda2_Egre";
			out_moneda3_ingre := reg."moneda3_Ingre";
			out_moneda3_egre := reg."moneda3_Egre";
       	return next;
     end loop;
	 return;
END;
$BODY$
LANGUAGE plpgsql VOLATILE;

CREATE OR REPLACE FUNCTION reportes_orden_pago(
	in in_codigo_caja character varying,
	in in_modulo character varying,
	in in_fecha_inicio date,
	in in_fecha_final date,
	out out_numero_transac integer,
	out out_oficina_nombre character varying,
	out out_nro_transac integer,
	out out_beneficiario_rs character varying,
	out out_solicitante_rs character varying,
	out out_importe numeric,
	out out_suma_importe numeric,
	out out_comision_dt numeric,
	out out_suma_comision_dt numeric,
	out out_st_estado character
)
      RETURNS SETOF record AS
    $BODY$
    declare
     reg RECORD;
    BEGIN
		drop table if exists tmp_tabla1;
		CREATE TEMP TABLE tmp_tabla1 as(
			select * from operacion_caja
				where 
					caja_codigo = in_codigo_caja and
					modulo = in_modulo and
					fecha_trabajo BETWEEN in_fecha_inicio AND in_fecha_final
		);
     	FOR reg IN
     		Select
		   		tabla1.nro_transaccion_dia,
				tabla3.oficina_nombre,
				tabla1.nro_transaccion,
				tabla2.beneficiario_razon_social,
				tabla2.solicitante_razon_social,
				tabla2.importe,
				sum(sum(tabla2.importe)) over(order by tabla1.nro_transaccion_dia asc) as suma_importe,
				tabla2.comision_dt,
				sum(sum(tabla2.comision_dt)) over(order by tabla1.nro_transaccion_dia asc) as suma_comision_dt,
				CASE st_estado
					WHEN 1 THEN 'PENDIENTE'
					WHEN 2 THEN 'PAGADO'
					WHEN 3 THEN 'ANULADO'
					WHEN 4 THEN 'EXTORNADO'
					ELSE 'Otro Caso'
				END as st_estado
			from 
				tmp_tabla1 tabla1, 
				transferencia tabla2,
				oficina tabla3
			where
				tabla1.documento_codigo = tabla2.op_documento_codigo and
				tabla1.documento_serie = tabla2.op_documento_serie and
				tabla1.nro_operacion = tabla2.op_nro_operacion and
				tabla2.oficina_codigo_origen = tabla3.oficina_codigo and
				tabla2.st_estado = 2
			group by
				tabla1.nro_transaccion_dia,
				tabla3.oficina_nombre,
				tabla1.nro_transaccion,
				tabla2.beneficiario_razon_social,
				tabla2.solicitante_razon_social,
				tabla2.importe,
				tabla2.comision_dt,
				tabla2.st_estado
     	loop
	 		out_numero_transac := reg.nro_transaccion_dia;
			out_oficina_nombre := reg.oficina_nombre;
			out_nro_transac := reg.nro_transaccion;
			out_beneficiario_rs := reg.beneficiario_razon_social;
			out_solicitante_rs := reg.solicitante_razon_social;
			out_importe := reg.importe;
			out_suma_importe := reg.suma_importe;
			out_comision_dt := reg.comision_dt;
			out_suma_comision_dt := reg.suma_comision_dt;
			out_st_estado := reg.st_estado;
       	return next;
     end loop;
	 return;
END;
$BODY$
LANGUAGE plpgsql VOLATILE;

CREATE OR REPLACE FUNCTION reportes_transferencia(
	in in_codigo_caja character varying,
	in in_modulo character varying,
	in in_fecha_inicio timestamp with time zone,
	in in_fecha_final timestamp with time zone,
	out out_oficina_nombre character varying,
	out out_nro_transac integer,
	out out_beneficiario_rs character varying,
	out out_solicitante_rs character varying,
	out out_importe numeric,
	out out_suma_importe numeric,
	out out_comision_dt numeric,
	out out_suma_comision_dt numeric,
	out out_st_estado character
)
      RETURNS SETOF record AS
    $BODY$
    declare
     reg RECORD;
    BEGIN
		drop table if exists tmp_tabla1;
		CREATE LOCAL TEMP TABLE tmp_tabla1 as(
			select
				oficina_codigo
			from 
				caja
			where 
				caja_codigo = in_codigo_caja
		);
     	FOR reg IN
     		Select
				tabla3.oficina_nombre,
				tabla1."nro_Solicitud",
				tabla1.beneficiario_razon_social,
				tabla1.solicitante_razon_social,
				tabla1.importe,
				sum(sum(tabla1.importe)) over(order by tabla1."nro_Solicitud" asc) as suma_importe,
				tabla1.comision_dt,
				sum(sum(tabla1.comision_dt)) over(order by tabla1."nro_Solicitud" asc) as suma_comision_dt,
				CASE st_estado
					WHEN 1 THEN 'PENDIENTE'
					WHEN 2 THEN 'PAGADO'
					WHEN 3 THEN 'ANULADO'
					WHEN 4 THEN 'EXTORNADO'
					ELSE 'Otro Caso'
				END as st_estado
			from
				transferencia tabla1,
				tmp_tabla1 tabla2,
				oficina tabla3
			where
				tabla1.oficina_codigo_destino = tabla2.oficina_codigo and
				tabla1.oficina_codigo_origen = tabla3.oficina_codigo and
				tabla1.solicitud_fecha_hora BETWEEN in_fecha_inicio AND in_fecha_final
			group by
				tabla3.oficina_nombre,
				tabla1."nro_Solicitud",
				tabla1.beneficiario_razon_social,
				tabla1.solicitante_razon_social,
				tabla1.importe,
				tabla1.comision_dt,
				tabla1.st_estado
     	loop
			out_oficina_nombre := reg.oficina_nombre;
			out_nro_transac := reg."nro_Solicitud";
			out_beneficiario_rs := reg.beneficiario_razon_social;
			out_solicitante_rs := reg.solicitante_razon_social;
			out_importe := reg.importe;
			out_suma_importe := reg.suma_importe;
			out_comision_dt := reg.comision_dt;
			out_suma_comision_dt := reg.suma_comision_dt;
			out_st_estado := reg.st_estado;
       	return next;
     end loop;
	 return;
END;
$BODY$
LANGUAGE plpgsql VOLATILE;

--select * from reportes_obtener_saldos_por_empresa('MEC-Z1','2019-10-16 00:00:00.000+00','2019-10-20 23:59:59.000+00');
--select * from reportes_anulados_extornados_por_empresa('MEC-Z1','Op','Extorno','ANULACION','2019-10-15 00:00:00.000+00','2019-10-31 23:59:59.000+00');
--select * from reportes_anulados_extornados_por_empresa('MEC-Z1','','Extorno','EXTORNO','2019-10-15 00:00:00.000+00','2019-10-31 23:59:59.000+00');
--select * from reportes_ordenpago_por_empresa('MEC-Z1','Op','2019-10-15 00:00:00.000+00','2019-10-31 23:59:59.000+00');
--select * from reportes_transferencia_por_empresa('MEC-Z1','Transferencia','2019-10-15 00:00:00.000+00','2019-10-31 23:59:59.000+00');
--select * from reportes_obtener_saldos_por_oficina('Z1-OF1','2019-10-16 00:00:00.000+00','2019-10-20 23:59:59.000+00');
--select * from reportes_anulados_extornados_por_oficina('Z1-OF1','Op','Extorno','ANULACION','2019-10-15 00:00:00.000+00','2019-10-31 23:59:59.000+00');
--select * from reportes_ordenpago_por_oficina('Z1-OF1','Op','2019-10-15 00:00:00.000+00','2019-10-31 23:59:59.000+00');
--select * from reportes_transferencia_por_oficina('Z1-OF1','Transferencia','2019-10-15 00:00:00.000+00','2019-10-31 23:59:59.000+00');
--select * from reportes_obtener_saldos('Z1-OF19','2019-10-16','2019-10-20');
--select * from reportes_anulados_extornados('Z1-OF19','Op','Extorno','ANULACION','2019-10-15','2019-10-20');
--select * from reportes_anulados_extornados('Z1-OF19','','Extorno','EXTORNO','2019-10-15','2019-10-20');
--select * from reportes_orden_pago('Z1-OF19','Op','2019-10-15','2019-10-20');
--select * from reportes_transferencia('Z1-OF19','Transferencia','2019-10-15 00:00:00.000+00','2019-10-31 23:59:59.000+00');

