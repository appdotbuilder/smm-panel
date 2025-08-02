
import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);
export const orderStatusEnum = pgEnum('order_status', ['pending', 'in_progress', 'completed', 'cancelled', 'partial']);
export const transactionTypeEnum = pgEnum('transaction_type', ['deposit', 'order', 'refund']);
export const transactionStatusEnum = pgEnum('transaction_status', ['pending', 'completed', 'failed']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  balance: numeric('balance', { precision: 10, scale: 2 }).notNull().default('0'),
  role: userRoleEnum('role').notNull().default('user'),
  api_key: text('api_key').unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Categories table
export const categoriesTable = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Services table
export const servicesTable = pgTable('services', {
  id: serial('id').primaryKey(),
  category_id: integer('category_id').notNull().references(() => categoriesTable.id),
  name: text('name').notNull(),
  description: text('description').notNull(),
  price_per_unit: numeric('price_per_unit', { precision: 10, scale: 6 }).notNull(),
  min_quantity: integer('min_quantity').notNull(),
  max_quantity: integer('max_quantity').notNull(),
  average_delivery_time: integer('average_delivery_time').notNull(),
  supports_drip_feed: boolean('supports_drip_feed').notNull().default(false),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Orders table
export const ordersTable = pgTable('orders', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  service_id: integer('service_id').notNull().references(() => servicesTable.id),
  quantity: integer('quantity').notNull(),
  total_price: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
  target_url: text('target_url').notNull(),
  drip_feed_enabled: boolean('drip_feed_enabled').notNull().default(false),
  drip_feed_runs: integer('drip_feed_runs'),
  drip_feed_interval: integer('drip_feed_interval'),
  status: orderStatusEnum('status').notNull().default('pending'),
  start_count: integer('start_count'),
  remains: integer('remains'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Transactions table
export const transactionsTable = pgTable('transactions', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  type: transactionTypeEnum('type').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  description: text('description').notNull(),
  crypto_currency: text('crypto_currency'),
  crypto_address: text('crypto_address'),
  crypto_tx_hash: text('crypto_tx_hash'),
  status: transactionStatusEnum('status').notNull().default('pending'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  orders: many(ordersTable),
  transactions: many(transactionsTable),
}));

export const categoriesRelations = relations(categoriesTable, ({ many }) => ({
  services: many(servicesTable),
}));

export const servicesRelations = relations(servicesTable, ({ one, many }) => ({
  category: one(categoriesTable, {
    fields: [servicesTable.category_id],
    references: [categoriesTable.id],
  }),
  orders: many(ordersTable),
}));

export const ordersRelations = relations(ordersTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [ordersTable.user_id],
    references: [usersTable.id],
  }),
  service: one(servicesTable, {
    fields: [ordersTable.service_id],
    references: [servicesTable.id],
  }),
}));

export const transactionsRelations = relations(transactionsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [transactionsTable.user_id],
    references: [usersTable.id],
  }),
}));

// Export all tables for relation queries
export const tables = {
  users: usersTable,
  categories: categoriesTable,
  services: servicesTable,
  orders: ordersTable,
  transactions: transactionsTable,
};
