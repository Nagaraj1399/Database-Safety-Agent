import { DatabaseSchema, TableDefinition } from '../types/database';

export interface DatabaseState {
  users: Record<string, any>[];
  products: Record<string, any>[];
  orders: Record<string, any>[];
  order_items: Record<string, any>[];
  payments: Record<string, any>[];
  subscriptions: Record<string, any>[];
}

export const INITIAL_SCHEMA: DatabaseSchema = {
  version: '2026.09.26.1',
  capturedAt: new Date().toISOString(),
  tables: {
    users: {
      name: 'users',
      primaryKey: ['id'],
      indexes: [
        { name: 'idx_users_email', tableName: 'users', columns: ['email'], isUnique: true },
        { name: 'idx_users_role', tableName: 'users', columns: ['role'], isUnique: false },
      ],
      constraints: [
        { name: 'users_pkey', type: 'PRIMARY KEY', tableName: 'users', columns: ['id'], definition: 'PRIMARY KEY (id)' },
        { name: 'users_email_key', type: 'UNIQUE', tableName: 'users', columns: ['email'], definition: 'UNIQUE (email)' },
      ],
      columns: [
        { name: 'id', type: 'UUID', nullable: false, isPrimaryKey: true },
        { name: 'name', type: 'VARCHAR(255)', nullable: false },
        { name: 'email', type: 'VARCHAR(255)', nullable: false, isUnique: true },
        { name: 'role', type: 'VARCHAR(50)', nullable: false, defaultValue: "'member'" },
        { name: 'status', type: 'VARCHAR(50)', nullable: false, defaultValue: "'active'" },
        { name: 'created_at', type: 'TIMESTAMP', nullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
      ],
    },
    products: {
      name: 'products',
      primaryKey: ['id'],
      indexes: [
        { name: 'idx_products_sku', tableName: 'products', columns: ['sku'], isUnique: true },
      ],
      constraints: [
        { name: 'products_pkey', type: 'PRIMARY KEY', tableName: 'products', columns: ['id'], definition: 'PRIMARY KEY (id)' },
        { name: 'products_sku_key', type: 'UNIQUE', tableName: 'products', columns: ['sku'], definition: 'UNIQUE (sku)' },
      ],
      columns: [
        { name: 'id', type: 'UUID', nullable: false, isPrimaryKey: true },
        { name: 'name', type: 'VARCHAR(255)', nullable: false },
        { name: 'sku', type: 'VARCHAR(100)', nullable: false, isUnique: true },
        { name: 'price', type: 'NUMERIC(10,2)', nullable: false },
        { name: 'stock_quantity', type: 'INTEGER', nullable: false, defaultValue: '0' },
        { name: 'created_at', type: 'TIMESTAMP', nullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
      ],
    },
    orders: {
      name: 'orders',
      primaryKey: ['id'],
      indexes: [
        { name: 'idx_orders_user_id', tableName: 'orders', columns: ['user_id'], isUnique: false },
        { name: 'idx_orders_status', tableName: 'orders', columns: ['status'], isUnique: false },
      ],
      constraints: [
        { name: 'orders_pkey', type: 'PRIMARY KEY', tableName: 'orders', columns: ['id'], definition: 'PRIMARY KEY (id)' },
      ],
      columns: [
        { name: 'id', type: 'UUID', nullable: false, isPrimaryKey: true },
        { name: 'user_id', type: 'UUID', nullable: false, isForeignKey: true, referencesTable: 'users', referencesColumn: 'id' },
        { name: 'order_number', type: 'VARCHAR(50)', nullable: false, isUnique: true },
        { name: 'total_amount', type: 'NUMERIC(10,2)', nullable: false },
        { name: 'status', type: 'VARCHAR(50)', nullable: false, defaultValue: "'pending'" },
        { name: 'created_at', type: 'TIMESTAMP', nullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
      ],
    },
    order_items: {
      name: 'order_items',
      primaryKey: ['id'],
      indexes: [
        { name: 'idx_order_items_order_id', tableName: 'order_items', columns: ['order_id'], isUnique: false },
        { name: 'idx_order_items_product_id', tableName: 'order_items', columns: ['product_id'], isUnique: false },
      ],
      constraints: [
        { name: 'order_items_pkey', type: 'PRIMARY KEY', tableName: 'order_items', columns: ['id'], definition: 'PRIMARY KEY (id)' },
        { name: 'order_items_order_fk', type: 'FOREIGN KEY', tableName: 'order_items', columns: ['order_id'], definition: 'FOREIGN KEY (order_id) REFERENCES orders(id)' },
        { name: 'order_items_product_fk', type: 'FOREIGN KEY', tableName: 'order_items', columns: ['product_id'], definition: 'FOREIGN KEY (product_id) REFERENCES products(id)' },
      ],
      columns: [
        { name: 'id', type: 'UUID', nullable: false, isPrimaryKey: true },
        { name: 'order_id', type: 'UUID', nullable: false, isForeignKey: true, referencesTable: 'orders', referencesColumn: 'id' },
        { name: 'product_id', type: 'UUID', nullable: false, isForeignKey: true, referencesTable: 'products', referencesColumn: 'id' },
        { name: 'quantity', type: 'INTEGER', nullable: false, defaultValue: '1' },
        { name: 'unit_price', type: 'NUMERIC(10,2)', nullable: false },
      ],
    },
    payments: {
      name: 'payments',
      primaryKey: ['id'],
      indexes: [
        { name: 'idx_payments_order_id', tableName: 'payments', columns: ['order_id'], isUnique: false },
        { name: 'idx_payments_ref', tableName: 'payments', columns: ['transaction_ref'], isUnique: true },
      ],
      constraints: [
        { name: 'payments_pkey', type: 'PRIMARY KEY', tableName: 'payments', columns: ['id'], definition: 'PRIMARY KEY (id)' },
        { name: 'payments_order_fk', type: 'FOREIGN KEY', tableName: 'payments', columns: ['order_id'], definition: 'FOREIGN KEY (order_id) REFERENCES orders(id)' },
      ],
      columns: [
        { name: 'id', type: 'UUID', nullable: false, isPrimaryKey: true },
        { name: 'order_id', type: 'UUID', nullable: false, isForeignKey: true, referencesTable: 'orders', referencesColumn: 'id' },
        { name: 'amount', type: 'NUMERIC(10,2)', nullable: false },
        { name: 'payment_method', type: 'VARCHAR(50)', nullable: false },
        { name: 'status', type: 'VARCHAR(50)', nullable: false, defaultValue: "'completed'" },
        { name: 'transaction_ref', type: 'VARCHAR(100)', nullable: false, isUnique: true },
        { name: 'created_at', type: 'TIMESTAMP', nullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
      ],
    },
    subscriptions: {
      name: 'subscriptions',
      primaryKey: ['id'],
      indexes: [
        { name: 'idx_subs_user_id', tableName: 'subscriptions', columns: ['user_id'], isUnique: false },
      ],
      constraints: [
        { name: 'subscriptions_pkey', type: 'PRIMARY KEY', tableName: 'subscriptions', columns: ['id'], definition: 'PRIMARY KEY (id)' },
        { name: 'subscriptions_user_fk', type: 'FOREIGN KEY', tableName: 'subscriptions', columns: ['user_id'], definition: 'FOREIGN KEY (user_id) REFERENCES users(id)' },
      ],
      columns: [
        { name: 'id', type: 'UUID', nullable: false, isPrimaryKey: true },
        { name: 'user_id', type: 'UUID', nullable: false, isForeignKey: true, referencesTable: 'users', referencesColumn: 'id' },
        { name: 'plan', type: 'VARCHAR(50)', nullable: false },
        { name: 'status', type: 'VARCHAR(50)', nullable: false, defaultValue: "'active'" },
        { name: 'current_period_end', type: 'TIMESTAMP', nullable: false },
        { name: 'created_at', type: 'TIMESTAMP', nullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
      ],
    },
  },
};

// Generates seeded test database meeting and exceeding the requirements
export function generateSeedData(): DatabaseState {
  const users: Record<string, any>[] = [];
  const products: Record<string, any>[] = [];
  const orders: Record<string, any>[] = [];
  const order_items: Record<string, any>[] = [];
  const payments: Record<string, any>[] = [];
  const subscriptions: Record<string, any>[] = [];

  const roles = ['admin', 'manager', 'developer', 'analyst', 'member', 'billing_admin'];
  const firstNames = ['Elena', 'Marcus', 'Samantha', 'Devon', 'Priya', 'Liam', 'Zoe', 'Alexander', 'Chloe', 'Nathan', 'Aria', 'Julian', 'Fatima', 'Kai', 'Sophia', 'Lucas'];
  const lastNames = ['Vance', 'Sterling', 'Chen', 'Okoro', 'Patel', 'Lindqvist', 'Nakamura', 'Gupta', 'Morales', 'Kovacs', 'Sinclair', 'Dubois', 'Washington', 'Reid'];
  const domains = ['cloudscale.io', 'hyperion.org', 'databound.tech', 'enterprise-platform-systems.co.uk', 'quantumlogic.network', 'acme-corp.internal'];

  // Seed 120 Users
  for (let i = 1; i <= 120; i++) {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[(i * 3) % lastNames.length];
    const dom = domains[i % domains.length];
    // Intentionally create some emails > 30 chars for realistic truncation detection
    const email = i % 5 === 0 
      ? `${fn.toLowerCase()}.${ln.toLowerCase()}.infrastructure@${dom}`
      : `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@${dom}`;

    users.push({
      id: `usr_${1000 + i}`,
      name: `${fn} ${ln}`,
      email,
      role: roles[i % roles.length],
      status: i % 15 === 0 ? 'inactive' : 'active',
      created_at: new Date(Date.now() - (120 - i) * 86400000 * 2).toISOString(),
    });
  }

  // Seed 110 Products
  const productCategories = ['Cloud Engine', 'Vector DB Addon', 'Dedicated VPC', 'Compute Node', 'Edge Cache Unit', 'Audit Log Archiver', 'Enterprise SLA Tier', 'Realtime Stream Relay'];
  for (let i = 1; i <= 110; i++) {
    const cat = productCategories[i % productCategories.length];
    const price = Number((19.99 + (i * 14.5) % 480).toFixed(2));
    products.push({
      id: `prod_${2000 + i}`,
      name: `${cat} Series-${String.fromCharCode(65 + (i % 6))}${i}`,
      sku: `SKU-${10000 + i}`,
      price,
      stock_quantity: 10 + ((i * 7) % 250),
      created_at: new Date(Date.now() - 180 * 86400000).toISOString(),
    });
  }

  // Seed 520 Orders & 1050 Order Items
  const orderStatuses = ['completed', 'processing', 'completed', 'shipped', 'cancelled', 'completed'];
  let orderItemCounter = 1;
  for (let i = 1; i <= 520; i++) {
    const userIndex = (i * 7) % users.length;
    const user = users[userIndex];
    const orderId = `ord_${3000 + i}`;
    const itemsCount = 1 + (i % 3); // 1 to 3 items per order
    let orderTotal = 0;

    for (let k = 0; k < itemsCount; k++) {
      const prodIndex = (i + k * 11) % products.length;
      const product = products[prodIndex];
      const qty = 1 + ((i + k) % 4);
      const unitPrice = product.price;
      orderTotal += Number((qty * unitPrice).toFixed(2));

      order_items.push({
        id: `itm_${4000 + orderItemCounter++}`,
        order_id: orderId,
        product_id: product.id,
        quantity: qty,
        unit_price: unitPrice,
      });
    }

    const orderStatus = orderStatuses[i % orderStatuses.length];
    orders.push({
      id: orderId,
      user_id: user.id,
      order_number: `TF-ORD-${100000 + i}`,
      total_amount: Number(orderTotal.toFixed(2)),
      status: orderStatus,
      created_at: new Date(Date.now() - (520 - i) * 3600000 * 6).toISOString(),
    });

    // Seed 520 Payments
    const payMethods = ['credit_card', 'ach_transfer', 'wire_transfer', 'corporate_po'];
    payments.push({
      id: `pay_${5000 + i}`,
      order_id: orderId,
      amount: Number(orderTotal.toFixed(2)),
      payment_method: payMethods[i % payMethods.length],
      status: orderStatus === 'cancelled' ? 'refunded' : 'completed',
      transaction_ref: `txn_tf_live_${800000 + i}_${(i * 19) % 9999}`,
      created_at: new Date(Date.now() - (520 - i) * 3600000 * 6 + 120000).toISOString(),
    });
  }

  // Seed 85 Subscriptions
  const subPlans = ['starter_monthly', 'pro_annual', 'team_enterprise', 'scale_tier_v2'];
  for (let i = 1; i <= 85; i++) {
    const user = users[i - 1];
    subscriptions.push({
      id: `sub_${6000 + i}`,
      user_id: user.id,
      plan: subPlans[i % subPlans.length],
      status: i % 10 === 0 ? 'past_due' : 'active',
      current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
      created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    });
  }

  return {
    users,
    products,
    orders,
    order_items,
    payments,
    subscriptions,
  };
}
