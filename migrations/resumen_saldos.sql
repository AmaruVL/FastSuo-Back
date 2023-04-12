DROP FUNCTION IF EXISTS resumen_saldos;
CREATE OR REPLACE FUNCTION resumen_saldos()
RETURNS TABLE (
	oficina_origen_codigo character varying,
	oficina_nombre character varying,
	oficina_tipo character varying,
	soles DECIMAL(7, 2),
	dolares DECIMAL(7, 2),
	cantidad bigint,
	monto DECIMAL(7, 2),
	ValorRef boolean
)
LANGUAGE 'plpgsql'    
  AS $BODY$
    BEGIN      
		drop table if exists tabla_saldos;
		CREATE TEMP TABLE tabla_saldos as(
		select "oficina"."oficina_codigo","oficina"."oficina_nombre","oficina"."oficina_tipo",
		coalesce(sum("operacion_caja"."moneda1_Ingre" - "operacion_caja"."moneda1_Egre"),0) as soles,
		coalesce(sum("operacion_caja"."moneda2_Ingre" - "operacion_caja"."moneda2_Egre"),0) as dolares
		from operacion_caja
		right outer join oficina on "operacion_caja"."oficina_origen_codigo"="oficina"."oficina_codigo"
		group by "oficina"."oficina_codigo","oficina"."oficina_nombre");

		drop table if exists tabla_op;
		CREATE TEMP TABLE tabla_op as(
		select coalesce(count(*),0) as cantidad,"transferencia"."oficina_codigo_destino",
		coalesce(sum(importe),0) as monto  
		from transferencia 
		where st_estado=1 and moneda='1'
		group by "transferencia"."oficina_codigo_destino");

		RETURN QUERY 
		select "t1"."oficina_codigo","t1"."oficina_nombre","t1"."oficina_tipo","t1"."soles",
			 "t1"."dolares",coalesce("t2"."cantidad",0),coalesce("t2"."monto",0),
			 "t1"."soles"+"t1"."dolares"+coalesce("t2"."cantidad",0)+coalesce("t2"."monto",0)>0 as ValorRef
			 from tabla_saldos t1
			 left outer join tabla_op t2 on "t1"."oficina_codigo"="t2"."oficina_codigo_destino"
			 order by ValorRef desc, "t1"."oficina_tipo" desc, "t1"."oficina_nombre";
	END;
$BODY$;

DROP FUNCTION IF EXISTS resumen_saldos1;
CREATE OR REPLACE FUNCTION resumen_saldos1(
	IN opcion integer default 0,
	IN fechaFin timestamp with time zone DEFAULT CURRENT_DATE,
	IN oficina VARCHAR(12) DEFAULT '*'
)
RETURNS TABLE (
	oficina_codigo character varying,
	oficina_nombre character varying,
	oficina_tipo character varying,
	tipo_arreglo character varying,
	saldo_contable numeric,
	saldo_real numeric,
	pendientes numeric,
	cantidad bigint,
	monto numeric,
	saldo_caja_soles numeric
)
LANGUAGE 'plpgsql'    
  AS $BODY$
    BEGIN 
		return query
		select  
			Ofi.oficina_codigo, 
			Ofi.oficina_nombre,
			Ofi.oficina_tipo,
			Ofi.tipo_arreglo,
		
			(((COALESCE(rec.totalImprte,0) 
			+ COALESCE(Habi_a.totalImprte,0) 
			+ COALESCE(anuladas.totalImprte,0)
			- COALESCE(Habi_e.totalImprte  ,0)
			- COALESCE(recibidas.totalImprte,0))

			-
			(	COALESCE(hab_origen_migracion.totalImprte,0)
				-COALESCE(hab_destino_migracion.totalImprte,0) 
				+ COALESCE(giros_migracion.totalImprte,0)
			)) )* -1 as saldo_contable,
			 
			((COALESCE(rec.totalImprte,0) 
			+ COALESCE(Habi_a.totalImprte,0)
			+ COALESCE(anuladas.totalImprte,0)
			- COALESCE(Habi_e.totalImprte  ,0)
			- COALESCE(pag.totalImprte,0))

			-
			(	COALESCE(hab_origen_migracion.totalImprte,0) 
			- COALESCE(hab_destino_migracion.totalImprte,0)
			) )* -1 as saldo_real,
			
		COALESCE(pend.totalImprte,0) as pendientes,
		coalesce(giros.cantidad,0) as cantidad,
		coalesce(giros.monto,0) as monto,
		coalesce(saldo_caja.soles,0) as saldo_caja_soles 
		
		from ( oficina as Ofi inner join empresa ON empresa.empresa_codigo = Ofi.empresa_codigo)
		--saldo caja soles
		left join( select oficina_origen_codigo, 
				coalesce(sum("operacion_caja"."moneda1_Ingre" - "operacion_caja"."moneda1_Egre"),0) as soles
				from operacion_caja
				group by oficina_origen_codigo) as saldo_caja 
			on saldo_caja.oficina_origen_codigo = Ofi.oficina_codigo
			--habilitaciones origen sistema anterior
			left join ( select 
					   		origen_oficina_codigo, 
					   		sum(importe) as totalImprte
						from habilitacion 
					   	where origen_docu_serie = 9999
						group by origen_oficina_codigo) as hab_origen_migracion
			on hab_origen_migracion.origen_oficina_codigo = Ofi.oficina_codigo
			--habilitaciones destino sistema anterior
			left join ( select 
					   		destino_oficina_codigo, 
					   		sum(importe) as totalImprte
						from habilitacion 
					   	where origen_docu_serie = 9999
						group by destino_oficina_codigo)  as hab_destino_migracion
			on hab_destino_migracion.destino_oficina_codigo = Ofi.oficina_codigo
			--giros sistema anterior
			left join ( select 
					   		oficina_codigo_destino, 
					   		sum(importe) as totalImprte
						from transferencia 
					   	where "St_documento_serie" = 999
						group by oficina_codigo_destino)  as giros_migracion
			on giros_migracion.oficina_codigo_destino = Ofi.oficina_codigo
			
			--PEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
	
			--EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
			
			--habiltiaciones enviadas
			left join ( select origen_oficina_codigo, sum(importe) as totalImprte
						from habilitacion 
						where habilitacion_estado  in ('PENDIENTE','ACEPTADO')
							and "updatedAt" < ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')
					   	and origen_docu_serie != 9999
						group by origen_oficina_codigo) as Habi_e
			on Habi_e.origen_oficina_codigo = Ofi.oficina_codigo
			--habiltiaciones aceptadas
			left join ( select destino_oficina_codigo, sum(importe) as totalImprte
						from habilitacion 
						where habilitacion_estado  in ('ACEPTADO')
							and "updatedAt" < ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')
					   	and destino_documento_serie != 9999
						group by destino_oficina_codigo) as Habi_a
			on Habi_a.destino_oficina_codigo = Ofi.oficina_codigo
			--pendientes
			left join ( select oficina_codigo_destino, sum(importe) as totalImprte
						from (
							select 
								importe, comision_dt, comision_banco, 
								gastos_administrativos, solicitud_fecha_hora,  op_fecha_hora,
								oficina_codigo_origen, oficina_codigo_destino, "St_documento_serie",
								CASE 
									WHEN ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')> "Giro"."anulacion_fecha_hora"  THEN 
										3
									WHEN ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')> "Giro"."op_fecha_hora"  THEN 
										2
									ELSE 1
								END AS "st_estado"
								from transferencia AS "Giro"
							) as filtroTransferencia
						where st_estado = 1
						and solicitud_fecha_hora < ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')
						group by oficina_codigo_destino) as pend 
			on pend.oficina_codigo_destino = Ofi.oficina_codigo
			--recaudadas
			left join ( select oficina_codigo_origen, sum(importe + COALESCE(comision_dt,0) + COALESCE(comision_banco,0) + COALESCE(gastos_administrativos,0)) as totalImprte
						from (
							select 
								importe, comision_dt, comision_banco, 
								gastos_administrativos, solicitud_fecha_hora,  op_fecha_hora,
								oficina_codigo_origen, oficina_codigo_destino, "St_documento_serie",
								CASE 
									WHEN ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')> "Giro"."anulacion_fecha_hora"  THEN 
										3
									WHEN ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')> "Giro"."op_fecha_hora"  THEN 
										2
									ELSE 1
								END AS "st_estado"
								from transferencia AS "Giro"
							) as filtroTransferencia

					   	where st_estado in (1, 2)
							and solicitud_fecha_hora < ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')
					   	and "St_documento_serie" != 999
						group by oficina_codigo_origen) as rec 
			on rec.oficina_codigo_origen = Ofi.oficina_codigo
			--recibidas
			left join ( select oficina_codigo_destino, sum(importe + COALESCE(comision_banco,0)) as totalImprte
						from (
							select 
								importe, comision_dt, comision_banco, 
								gastos_administrativos, solicitud_fecha_hora,  op_fecha_hora,
								oficina_codigo_origen, oficina_codigo_destino, "St_documento_serie",
								CASE 
									WHEN ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')> "Giro"."anulacion_fecha_hora"  THEN 
										3
									WHEN ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')> "Giro"."op_fecha_hora"  THEN 
										2
									ELSE 1
								END AS "st_estado"
								from transferencia AS "Giro"
							) as filtroTransferencia
						where 
					   	st_estado in (1, 2)
							and solicitud_fecha_hora < ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')
					   	and "St_documento_serie" != 999
						group by oficina_codigo_destino) as recibidas
			on recibidas.oficina_codigo_destino = Ofi.oficina_codigo
			--pagadas
			left join ( select oficina_codigo_destino, sum(importe + COALESCE(comision_banco,0)) as totalImprte
						from (
							select 
								importe, comision_dt, comision_banco, 
								gastos_administrativos, solicitud_fecha_hora, op_fecha_hora,
								oficina_codigo_origen, oficina_codigo_destino, "St_documento_serie",
								CASE 
									WHEN ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')> "Giro"."anulacion_fecha_hora"  THEN 
										3
									WHEN ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')> "Giro"."op_fecha_hora"  THEN 
										2
									ELSE 1
								END AS "st_estado"
								from transferencia AS "Giro"
							) as filtroTransferencia
						where st_estado = 2
						and op_fecha_hora < ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')
						group by oficina_codigo_destino) as pag 
			on pag.oficina_codigo_destino = Ofi.oficina_codigo
			--anuladas
			left join ( select oficina_codigo_origen, sum(COALESCE(comision_dt,0)) as totalImprte
						from transferencia
						where st_estado = 4
						and anulacion_fecha_hora < ((DATE(fechaFin) + time '23:59:59')AT TIME ZONE 'PET')
						group by oficina_codigo_origen) as anuladas 
			on anuladas.oficina_codigo_origen = Ofi.oficina_codigo
			--giros_pendientes
			left join (select coalesce(count(*),0) as cantidad,"transferencia"."oficina_codigo_destino",
				coalesce(sum(importe),0) as monto  
				from transferencia 
				where st_estado=1 and moneda='1'
				group by "transferencia"."oficina_codigo_destino") as giros 
			on giros.oficina_codigo_destino=Ofi.oficina_codigo 
		WHERE  (
            CASE 
              WHEN oficina != '*' THEN 
                Ofi.oficina_codigo = oficina
              ELSE TRUE 
            END) and 
			(case when opcion=0 then Ofi.estado_registro=true else true end)	
		order by Ofi.oficina_tipo,Ofi.oficina_nombre ;		
	END;
$BODY$;
