select empresa.empresa_codigo, empresa.razon_social, Ofi.oficina_codigo, Ofi.oficina_nombre,
		COALESCE(Habi_e.totalImprte,0) as acreedor,		
		COALESCE(Habi_a.totalImprte,0) as deudor,
		COALESCE(pend.totalImprte,0) as pendientes,
		COALESCE(rec.totalImprte,0) as recaudadas,		
		COALESCE(reg.totalImprte,0) as registradas,
		COALESCE(pag.totalImprte,0) as pagadas
		from ( oficina as Ofi inner join empresa ON empresa.empresa_codigo = Ofi.empresa_codigo)
			--habiltiaciones enviadas
			left join ( select origen_oficina_codigo, sum(importe) as totalImprte
						from habilitacion 
						where habilitacion_estado  in ('PENDIENTE','ACEPTADO')
						group by origen_oficina_codigo) as Habi_e
			on Habi_e.origen_oficina_codigo = Ofi.oficina_codigo
			--habiltiaciones aceptadas
			left join ( select destino_oficina_codigo, sum(importe) as totalImprte
						from habilitacion 
						where habilitacion_estado  in ('ACEPTADO')
						group by destino_oficina_codigo) as Habi_a
			on Habi_a.destino_oficina_codigo = Ofi.oficina_codigo
			--pendientes
			left join ( select oficina_codigo_destino, sum(importe) as totalImprte
						from transferencia 
						where st_estado = 1
						group by oficina_codigo_destino) as pend 
			on pend.oficina_codigo_destino = Ofi.oficina_codigo
			--recaudadas
			left join ( select oficina_codigo_origen, sum(importe + COALESCE(comision_dt,0) + COALESCE(comision_banco,0) + COALESCE(gastos_administrativos,0)) as totalImprte
						from transferencia 
						group by oficina_codigo_origen) as rec 
			on rec.oficina_codigo_origen = Ofi.oficina_codigo
			--registradas
			left join ( select oficina_codigo_destino, sum(importe + COALESCE(comision_dt,0) + COALESCE(comision_banco,0) + COALESCE(gastos_administrativos,0)) as totalImprte
						from transferencia 
						where st_estado in (1, 2)
						group by oficina_codigo_destino) as reg
			on reg.oficina_codigo_destino = Ofi.oficina_codigo
			--pagadas
			left join ( select oficina_codigo_destino, sum(importe) as totalImprte
						from transferencia 
						where st_estado = 2
						group by oficina_codigo_destino) as pag 
			on pag.oficina_codigo_destino = Ofi.oficina_codigo

		order by Ofi.oficina_codigo;