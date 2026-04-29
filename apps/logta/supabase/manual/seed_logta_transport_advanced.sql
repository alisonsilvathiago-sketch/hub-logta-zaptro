-- Manual seed for advanced Logta transport modules
-- Run in Supabase SQL editor after migrations are applied.

DO $$
DECLARE
  v_company_id UUID := gen_random_uuid();
  v_admin_id UUID := gen_random_uuid();
  v_driver_user_id UUID := gen_random_uuid();
  v_client_id UUID := gen_random_uuid();
  v_supplier_id UUID := gen_random_uuid();
  v_vehicle_id UUID := gen_random_uuid();
  v_driver_profile_id UUID := gen_random_uuid();
  v_route_id UUID := gen_random_uuid();
  v_stop_id UUID := gen_random_uuid();
  v_shipment_id UUID := gen_random_uuid();
  v_receivable_id UUID := gen_random_uuid();
  v_payable_id UUID := gen_random_uuid();
  v_fin_account_id UUID := gen_random_uuid();
  v_cost_center_id UUID := gen_random_uuid();
BEGIN
  INSERT INTO public.companies (id, name, cnpj, email, phone)
  VALUES (v_company_id, 'Logta Demo Transportes', '12.345.678/0001-90', 'financeiro@logta-demo.com', '+55 11 99999-1111')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (id, company_id, full_name, email, role, permissions)
  VALUES
    (v_admin_id, v_company_id, 'Admin Demo Logta', 'admin@logta-demo.com', 'ADMIN', '[]'::jsonb),
    (v_driver_user_id, v_company_id, 'Motorista Demo', 'motorista@logta-demo.com', 'MOTORISTA', '[]'::jsonb)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.clients (id, company_id, name, email, phone, status)
  VALUES (v_client_id, v_company_id, 'Cliente Operação Demo', 'cliente@demo.com', '+55 11 98888-0000', 'ACTIVE')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.suppliers (id, company_id, name, cnpj, phone)
  VALUES (v_supplier_id, v_company_id, 'Posto Demo', '22.222.222/0001-22', '+55 11 97777-0000')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.financial_accounts (id, company_id, name, account_type, bank_name)
  VALUES (v_fin_account_id, v_company_id, 'Conta Principal', 'CHECKING', 'Banco Demo')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.cost_centers (id, company_id, code, name, description)
  VALUES (v_cost_center_id, v_company_id, 'OPS', 'Operações', 'Centro de custo operacional')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.receivables (
    id, company_id, client_id, cost_center_id, financial_account_id, description,
    issue_date, due_date, amount, paid_amount, status
  ) VALUES (
    v_receivable_id, v_company_id, v_client_id, v_cost_center_id, v_fin_account_id,
    'Frete operação demo', CURRENT_DATE - 3, CURRENT_DATE - 1, 7500.00, 0, 'OVERDUE'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.payables (
    id, company_id, supplier_id, cost_center_id, financial_account_id, description,
    issue_date, due_date, amount, paid_amount, status
  ) VALUES (
    v_payable_id, v_company_id, v_supplier_id, v_cost_center_id, v_fin_account_id,
    'Combustível mensal', CURRENT_DATE - 5, CURRENT_DATE + 5, 2100.00, 0, 'PENDING'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.vehicles (
    id, company_id, code, plate, model, manufacturer, year, fuel_type, status, current_odometer_km
  ) VALUES (
    v_vehicle_id, v_company_id, 'TRK-001', 'ABC1D23', 'FH 540', 'Volvo', 2022, 'DIESEL', 'OPERACIONAL', 152340
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.driver_profiles (
    id, company_id, profile_id, cnh_number, cnh_category, cnh_expiration, medical_exam_expiration
  ) VALUES (
    v_driver_profile_id, v_company_id, v_driver_user_id, '12345678900', 'E', CURRENT_DATE + 180, CURRENT_DATE + 90
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.route_plans (
    id, company_id, name, route_date, status, optimized_by_ai, estimated_distance_km, estimated_cost, created_by
  ) VALUES (
    v_route_id, v_company_id, 'Rota SP Interior - Demo', CURRENT_DATE, 'PLANNED', TRUE, 320, 980.00, v_admin_id
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.route_assignments (company_id, route_plan_id, driver_profile_id, vehicle_id, assignment_notes)
  VALUES (v_company_id, v_route_id, v_driver_user_id, v_vehicle_id, 'Escala demo');

  INSERT INTO public.shipments (id, company_id, client_id, status, description, weight, lat, lng, created_at)
  VALUES (
    v_shipment_id, v_company_id, v_client_id, 'EM_ROTA', 'Entrega demo para validação de tracking', 1250,
    -23.55052, -46.633308, NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.route_stops (
    id, company_id, route_plan_id, shipment_id, client_id, sequence_no, stop_type, address, latitude, longitude, eta
  ) VALUES (
    v_stop_id, v_company_id, v_route_id, v_shipment_id, v_client_id, 1, 'DELIVERY',
    'Av. Paulista, 1000 - São Paulo/SP', -23.561684, -46.655981, NOW() + INTERVAL '2 hour'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.vehicle_fuel_logs (
    company_id, vehicle_id, fueled_at, liters, total_cost, odometer_km, station_name, created_by
  ) VALUES (
    v_company_id, v_vehicle_id, NOW(), 180.5, 1125.90, 152500, 'Posto Demo Sul', v_admin_id
  );

  INSERT INTO public.vehicle_maintenance (
    company_id, vehicle_id, maintenance_type, description, completed_at, cost, odometer_km, service_provider
  ) VALUES (
    v_company_id, v_vehicle_id, 'PREVENTIVE', 'Troca de óleo e filtros', CURRENT_DATE, 890.00, 152450, 'Oficina Parceira'
  );

  INSERT INTO public.shipment_events (
    company_id, shipment_id, event_type, event_label, event_data, happened_at, created_by
  ) VALUES (
    v_company_id, v_shipment_id, 'STATUS_CHANGE', 'Shipment entrou em rota', '{"from":"PENDENTE","to":"EM_ROTA"}'::jsonb, NOW(), v_admin_id
  );

  INSERT INTO public.gps_track_points (
    company_id, route_plan_id, vehicle_id, driver_profile_id, latitude, longitude, speed_kmh, heading_degrees, recorded_at
  ) VALUES (
    v_company_id, v_route_id, v_vehicle_id, v_driver_user_id, -23.554, -46.640, 68.4, 102.0, NOW()
  );

  INSERT INTO public.inventory_items (
    company_id, sku, name, category, current_stock, min_stock, unit, location, unit_cost
  ) VALUES (
    v_company_id, 'PNEU-295-80', 'Pneu 295/80 R22.5', 'PEÇAS', 12, 4, 'UN', 'Depósito A', 2450.00
  )
  ON CONFLICT (company_id, sku) DO NOTHING;

  RAISE NOTICE 'Seed concluído com company_id=%', v_company_id;
END $$;
