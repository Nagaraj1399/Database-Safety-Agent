-- TrueForge Database Seed Data
-- Generates 120 users, 110 products, 520 orders, 1050 order items, 520 payments, 85 subscriptions

-- Seed 120 Users
INSERT INTO users (id, name, email, role, status, created_at)
SELECT 
    ('a0000000-0000-0000-0000-' || LPAD(i::text, 12, '0'))::uuid,
    'User ' || i || ' ' || (ARRAY['Vance', 'Chen', 'Okoro', 'Patel', 'Lindqvist', 'Nakamura', 'Gupta', 'Morales'])[1 + (i % 8)],
    CASE 
        WHEN i % 5 = 0 THEN 'enterprise.infrastructure.analyst.' || i || '@global-operations-corp.internal'
        ELSE 'engineer_' || i || '@trueforge.io'
    END,
    (ARRAY['admin', 'manager', 'developer', 'analyst', 'member'])[1 + (i % 5)],
    CASE WHEN i % 15 = 0 THEN 'inactive' ELSE 'active' END,
    NOW() - (i || ' days')::interval
FROM generate_series(1, 120) AS i
ON CONFLICT (email) DO NOTHING;

-- Seed 110 Products
INSERT INTO products (id, name, sku, price, stock_quantity, created_at)
SELECT
    ('b0000000-0000-0000-0000-' || LPAD(i::text, 12, '0'))::uuid,
    (ARRAY['Cloud Engine Node', 'Vector DB Tier', 'Dedicated VPC', 'Edge Cache Unit', 'Audit Streamer'])[1 + (i % 5)] || ' v' || i,
    'SKU-' || (10000 + i),
    (29.99 + (i * 12.50) % 450)::numeric(10,2),
    10 + (i * 7) % 200,
    NOW() - '180 days'::interval
FROM generate_series(1, 110) AS i
ON CONFLICT (sku) DO NOTHING;

-- Seed 520 Orders
INSERT INTO orders (id, user_id, order_number, total_amount, status, created_at)
SELECT
    ('c0000000-0000-0000-0000-' || LPAD(i::text, 12, '0'))::uuid,
    ('a0000000-0000-0000-0000-' || LPAD((1 + (i * 7) % 120)::text, 12, '0'))::uuid,
    'TF-ORD-' || (100000 + i),
    (49.00 + (i * 15.20) % 1200)::numeric(10,2),
    (ARRAY['completed', 'completed', 'processing', 'completed', 'cancelled', 'shipped'])[1 + (i % 6)],
    NOW() - ((520 - i) || ' hours')::interval
FROM generate_series(1, 520) AS i
ON CONFLICT (order_number) DO NOTHING;

-- Seed 1050 Order Items
INSERT INTO order_items (id, order_id, product_id, quantity, unit_price)
SELECT
    ('d0000000-0000-0000-0000-' || LPAD(i::text, 12, '0'))::uuid,
    ('c0000000-0000-0000-0000-' || LPAD((1 + (i % 520))::text, 12, '0'))::uuid,
    ('b0000000-0000-0000-0000-' || LPAD((1 + (i * 3) % 110)::text, 12, '0'))::uuid,
    1 + (i % 4),
    (29.99 + (i * 8.5) % 150)::numeric(10,2)
FROM generate_series(1, 1050) AS i
ON CONFLICT DO NOTHING;

-- Seed 520 Payments
INSERT INTO payments (id, order_id, amount, payment_method, status, transaction_ref, created_at)
SELECT
    ('e0000000-0000-0000-0000-' || LPAD(i::text, 12, '0'))::uuid,
    ('c0000000-0000-0000-0000-' || LPAD(i::text, 12, '0'))::uuid,
    (49.00 + (i * 15.20) % 1200)::numeric(10,2),
    (ARRAY['credit_card', 'ach_transfer', 'wire_transfer'])[1 + (i % 3)],
    'completed',
    'txn_tf_live_' || (800000 + i) || '_' || (i * 37 % 9999),
    NOW() - ((520 - i) || ' hours')::interval + '2 minutes'::interval
FROM generate_series(1, 520) AS i
ON CONFLICT (transaction_ref) DO NOTHING;

-- Seed 85 Subscriptions
INSERT INTO subscriptions (id, user_id, plan, status, current_period_end, created_at)
SELECT
    ('f0000000-0000-0000-0000-' || LPAD(i::text, 12, '0'))::uuid,
    ('a0000000-0000-0000-0000-' || LPAD(i::text, 12, '0'))::uuid,
    (ARRAY['starter_monthly', 'pro_annual', 'team_enterprise', 'scale_tier_v2'])[1 + (i % 4)],
    CASE WHEN i % 10 = 0 THEN 'past_due' ELSE 'active' END,
    NOW() + '30 days'::interval,
    NOW() - '90 days'::interval
FROM generate_series(1, 85) AS i
ON CONFLICT DO NOTHING;
