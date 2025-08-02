
import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  password_hash: z.string(),
  balance: z.number(),
  role: z.enum(['user', 'admin']),
  api_key: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Category schema
export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Category = z.infer<typeof categorySchema>;

// Service schema
export const serviceSchema = z.object({
  id: z.number(),
  category_id: z.number(),
  name: z.string(),
  description: z.string(),
  price_per_unit: z.number(),
  min_quantity: z.number().int(),
  max_quantity: z.number().int(),
  average_delivery_time: z.number().int(),
  supports_drip_feed: z.boolean(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Service = z.infer<typeof serviceSchema>;

// Order schema
export const orderSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  service_id: z.number(),
  quantity: z.number().int(),
  total_price: z.number(),
  target_url: z.string(),
  drip_feed_enabled: z.boolean(),
  drip_feed_runs: z.number().int().nullable(),
  drip_feed_interval: z.number().int().nullable(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled', 'partial']),
  start_count: z.number().int().nullable(),
  remains: z.number().int().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Order = z.infer<typeof orderSchema>;

// Transaction schema
export const transactionSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  type: z.enum(['deposit', 'order', 'refund']),
  amount: z.number(),
  description: z.string(),
  crypto_currency: z.string().nullable(),
  crypto_address: z.string().nullable(),
  crypto_tx_hash: z.string().nullable(),
  status: z.enum(['pending', 'completed', 'failed']),
  created_at: z.coerce.date()
});

export type Transaction = z.infer<typeof transactionSchema>;

// Input schemas for creating entities
export const createUserInputSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['user', 'admin']).optional()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createCategoryInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional()
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

export const createServiceInputSchema = z.object({
  category_id: z.number(),
  name: z.string().min(1).max(200),
  description: z.string(),
  price_per_unit: z.number().positive(),
  min_quantity: z.number().int().positive(),
  max_quantity: z.number().int().positive(),
  average_delivery_time: z.number().int().positive(),
  supports_drip_feed: z.boolean()
});

export type CreateServiceInput = z.infer<typeof createServiceInputSchema>;

export const createOrderInputSchema = z.object({
  service_id: z.number(),
  quantity: z.number().int().positive(),
  target_url: z.string().url(),
  drip_feed_enabled: z.boolean().optional(),
  drip_feed_runs: z.number().int().positive().optional(),
  drip_feed_interval: z.number().int().positive().optional()
});

export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;

export const createTransactionInputSchema = z.object({
  user_id: z.number(),
  type: z.enum(['deposit', 'order', 'refund']),
  amount: z.number().positive(),
  description: z.string(),
  crypto_currency: z.string().optional(),
  crypto_address: z.string().optional(),
  crypto_tx_hash: z.string().optional()
});

export type CreateTransactionInput = z.infer<typeof createTransactionInputSchema>;

// Update schemas
export const updateUserInputSchema = z.object({
  id: z.number(),
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
  balance: z.number().optional(),
  role: z.enum(['user', 'admin']).optional()
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

export const updateServiceInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  price_per_unit: z.number().positive().optional(),
  min_quantity: z.number().int().positive().optional(),
  max_quantity: z.number().int().positive().optional(),
  average_delivery_time: z.number().int().positive().optional(),
  supports_drip_feed: z.boolean().optional(),
  is_active: z.boolean().optional()
});

export type UpdateServiceInput = z.infer<typeof updateServiceInputSchema>;

export const updateOrderInputSchema = z.object({
  id: z.number(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled', 'partial']).optional(),
  start_count: z.number().int().optional(),
  remains: z.number().int().optional()
});

export type UpdateOrderInput = z.infer<typeof updateOrderInputSchema>;

// Login schema
export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type LoginInput = z.infer<typeof loginInputSchema>;

// API key generation schema
export const generateApiKeyInputSchema = z.object({
  user_id: z.number()
});

export type GenerateApiKeyInput = z.infer<typeof generateApiKeyInputSchema>;
