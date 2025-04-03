import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Customer テーブル
export const customers = sqliteTable('customers', {
  customerId: text('customer_id').primaryKey(),
  name: text('name').notNull(),
  phoneNumber: text('phone_number'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
});

// CustomerVariable テーブル (顧客のカスタム変数)
export const customerVariables = sqliteTable('customer_variables', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').notNull().references(() => customers.customerId, { onDelete: 'cascade' }),
  key: text('key').notNull(),
  value: text('value'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
});

// Call テーブル
export const calls = sqliteTable('calls', {
  callId: text('call_id').primaryKey(),
  customerId: text('customer_id').notNull().references(() => customers.customerId),
  status: text('status').notNull(), // QUEUED, IN_PROGRESS, COMPLETED, CANCELED, FAILED
  requestedAt: integer('requested_at', { mode: 'timestamp' }).notNull(),
  startedAt: integer('started_at', { mode: 'timestamp' }),
  endedAt: integer('ended_at', { mode: 'timestamp' }),
  durationSec: integer('duration_sec'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
});
