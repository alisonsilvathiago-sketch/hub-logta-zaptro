-- Logta analytics views (DRE, route profitability, vehicle costs, delinquency)

CREATE OR REPLACE VIEW public.v_dre_monthly AS
SELECT
  t.company_id,
  DATE_TRUNC('month', t.created_at)::DATE AS period_month,
  SUM(CASE WHEN t.type = 'INCOME' AND COALESCE(t.status, 'PENDING') = 'PAID' THEN t.amount ELSE 0 END) AS gross_revenue,
  SUM(CASE WHEN t.type = 'EXPENSE' AND COALESCE(t.status, 'PENDING') = 'PAID' THEN t.amount ELSE 0 END) AS operating_expenses,
  SUM(
    CASE
      WHEN t.type = 'INCOME' AND COALESCE(t.status, 'PENDING') = 'PAID' THEN t.amount
      WHEN t.type = 'EXPENSE' AND COALESCE(t.status, 'PENDING') = 'PAID' THEN -t.amount
      ELSE 0
    END
  ) AS net_result
FROM public.transactions t
GROUP BY t.company_id, DATE_TRUNC('month', t.created_at)::DATE;

CREATE OR REPLACE VIEW public.v_route_profitability AS
WITH route_costs AS (
  SELECT
    rp.company_id,
    rp.id AS route_plan_id,
    COALESCE(SUM(vfl.total_cost), 0) AS fuel_cost,
    COALESCE(SUM(vm.cost), 0) AS maintenance_cost
  FROM public.route_plans rp
  LEFT JOIN public.route_assignments ra ON ra.route_plan_id = rp.id
  LEFT JOIN public.vehicle_fuel_logs vfl
    ON vfl.vehicle_id = ra.vehicle_id
   AND DATE(vfl.fueled_at) = rp.route_date
  LEFT JOIN public.vehicle_maintenance vm
    ON vm.vehicle_id = ra.vehicle_id
   AND vm.completed_at = rp.route_date
  GROUP BY rp.company_id, rp.id
),
route_revenue AS (
  SELECT
    rp.company_id,
    rp.id AS route_plan_id,
    COALESCE(SUM(b.total_amount), 0) AS revenue
  FROM public.route_plans rp
  LEFT JOIN public.route_stops rs ON rs.route_plan_id = rp.id
  LEFT JOIN public.shipments s ON s.id = rs.shipment_id
  LEFT JOIN public.billing b ON b.client_id = s.client_id AND DATE(b.billing_date) = rp.route_date
  GROUP BY rp.company_id, rp.id
)
SELECT
  rp.company_id,
  rp.id AS route_plan_id,
  rp.name AS route_name,
  rp.route_date,
  rr.revenue,
  rc.fuel_cost,
  rc.maintenance_cost,
  (rc.fuel_cost + rc.maintenance_cost) AS route_cost,
  (rr.revenue - (rc.fuel_cost + rc.maintenance_cost)) AS route_profit
FROM public.route_plans rp
LEFT JOIN route_costs rc ON rc.route_plan_id = rp.id
LEFT JOIN route_revenue rr ON rr.route_plan_id = rp.id;

CREATE OR REPLACE VIEW public.v_vehicle_cost_monthly AS
SELECT
  v.company_id,
  v.id AS vehicle_id,
  v.plate,
  DATE_TRUNC('month', COALESCE(vfl.fueled_at, vm.created_at))::DATE AS period_month,
  COALESCE(SUM(vfl.total_cost), 0) AS fuel_cost,
  COALESCE(SUM(vm.cost), 0) AS maintenance_cost,
  (COALESCE(SUM(vfl.total_cost), 0) + COALESCE(SUM(vm.cost), 0)) AS total_cost
FROM public.vehicles v
LEFT JOIN public.vehicle_fuel_logs vfl ON vfl.vehicle_id = v.id
LEFT JOIN public.vehicle_maintenance vm ON vm.vehicle_id = v.id
GROUP BY v.company_id, v.id, v.plate, DATE_TRUNC('month', COALESCE(vfl.fueled_at, vm.created_at))::DATE;

CREATE OR REPLACE VIEW public.v_receivables_delinquency AS
SELECT
  r.company_id,
  r.id AS receivable_id,
  r.client_id,
  r.description,
  r.due_date,
  r.amount,
  r.paid_amount,
  (r.amount - r.paid_amount) AS open_amount,
  CASE
    WHEN r.due_date < CURRENT_DATE AND r.status <> 'PAID' THEN TRUE
    ELSE FALSE
  END AS is_overdue,
  GREATEST((CURRENT_DATE - r.due_date), 0) AS days_overdue
FROM public.receivables r;
