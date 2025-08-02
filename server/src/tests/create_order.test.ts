
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, servicesTable, ordersTable } from '../db/schema';
import { type CreateOrderInput } from '../schema';
import { createOrder } from '../handlers/create_order';
import { eq } from 'drizzle-orm';

describe('createOrder', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testServiceId: number;

  const createTestUser = async (balance: number = 100) => {
    const result = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        balance: balance.toString(),
        role: 'user'
      })
      .returning()
      .execute();
    return result[0].id;
  };

  const createTestService = async (options: {
    pricePerUnit?: number;
    minQuantity?: number;
    maxQuantity?: number;
    supportsDripFeed?: boolean;
    isActive?: boolean;
  } = {}) => {
    // Create category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A test category'
      })
      .returning()
      .execute();

    const serviceResult = await db.insert(servicesTable)
      .values({
        category_id: categoryResult[0].id,
        name: 'Test Service',
        description: 'A test service',
        price_per_unit: (options.pricePerUnit || 1.5).toString(),
        min_quantity: options.minQuantity || 10,
        max_quantity: options.maxQuantity || 1000,
        average_delivery_time: 24,
        supports_drip_feed: options.supportsDripFeed || false,
        is_active: options.isActive !== undefined ? options.isActive : true
      })
      .returning()
      .execute();
    
    return serviceResult[0].id;
  };

  const testInput: CreateOrderInput = {
    service_id: 0, // Will be set in tests
    quantity: 50,
    target_url: 'https://example.com/target',
    drip_feed_enabled: false
  };

  it('should create an order successfully', async () => {
    testUserId = await createTestUser(100);
    testServiceId = await createTestService({ pricePerUnit: 1.5 });

    const input = { ...testInput, service_id: testServiceId };
    const result = await createOrder(input, testUserId);

    expect(result.user_id).toEqual(testUserId);
    expect(result.service_id).toEqual(testServiceId);
    expect(result.quantity).toEqual(50);
    expect(result.total_price).toEqual(75); // 50 * 1.5
    expect(result.target_url).toEqual('https://example.com/target');
    expect(result.drip_feed_enabled).toEqual(false);
    expect(result.status).toEqual('pending');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should deduct amount from user balance', async () => {
    testUserId = await createTestUser(100);
    testServiceId = await createTestService({ pricePerUnit: 2.0 });

    const input = { ...testInput, service_id: testServiceId, quantity: 25 };
    await createOrder(input, testUserId);

    // Check updated user balance
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, testUserId))
      .execute();

    expect(parseFloat(users[0].balance)).toEqual(50); // 100 - (25 * 2.0)
  });

  it('should save order to database', async () => {
    testUserId = await createTestUser(100);
    testServiceId = await createTestService();

    const input = { ...testInput, service_id: testServiceId };
    const result = await createOrder(input, testUserId);

    const orders = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.id, result.id))
      .execute();

    expect(orders).toHaveLength(1);
    expect(orders[0].user_id).toEqual(testUserId);
    expect(orders[0].service_id).toEqual(testServiceId);
    expect(orders[0].quantity).toEqual(50);
    expect(parseFloat(orders[0].total_price)).toEqual(75);
  });

  it('should handle drip feed orders', async () => {
    testUserId = await createTestUser(100);
    testServiceId = await createTestService({ supportsDripFeed: true });

    const input: CreateOrderInput = {
      ...testInput,
      service_id: testServiceId,
      drip_feed_enabled: true,
      drip_feed_runs: 5,
      drip_feed_interval: 60
    };

    const result = await createOrder(input, testUserId);

    expect(result.drip_feed_enabled).toEqual(true);
    expect(result.drip_feed_runs).toEqual(5);
    expect(result.drip_feed_interval).toEqual(60);
  });

  it('should throw error for insufficient balance', async () => {
    testUserId = await createTestUser(10); // Low balance
    testServiceId = await createTestService({ pricePerUnit: 2.0 });

    const input = { ...testInput, service_id: testServiceId, quantity: 50 }; // Total: 100

    await expect(createOrder(input, testUserId)).rejects.toThrow(/insufficient balance/i);
  });

  it('should throw error for non-existent user', async () => {
    testServiceId = await createTestService();

    const input = { ...testInput, service_id: testServiceId };

    await expect(createOrder(input, 999)).rejects.toThrow(/user not found/i);
  });

  it('should throw error for non-existent service', async () => {
    testUserId = await createTestUser(100);

    const input = { ...testInput, service_id: 999 };

    await expect(createOrder(input, testUserId)).rejects.toThrow(/service not found/i);
  });

  it('should throw error for inactive service', async () => {
    testUserId = await createTestUser(100);
    testServiceId = await createTestService({ isActive: false });

    const input = { ...testInput, service_id: testServiceId };

    await expect(createOrder(input, testUserId)).rejects.toThrow(/service is not active/i);
  });

  it('should throw error for quantity below minimum', async () => {
    testUserId = await createTestUser(100);
    testServiceId = await createTestService({ minQuantity: 100 });

    const input = { ...testInput, service_id: testServiceId, quantity: 50 };

    await expect(createOrder(input, testUserId)).rejects.toThrow(/quantity must be at least 100/i);
  });

  it('should throw error for quantity above maximum', async () => {
    testUserId = await createTestUser(100);
    testServiceId = await createTestService({ maxQuantity: 10 });

    const input = { ...testInput, service_id: testServiceId, quantity: 50 };

    await expect(createOrder(input, testUserId)).rejects.toThrow(/quantity cannot exceed 10/i);
  });

  it('should throw error for drip feed on unsupported service', async () => {
    testUserId = await createTestUser(100);
    testServiceId = await createTestService({ supportsDripFeed: false });

    const input: CreateOrderInput = {
      ...testInput,
      service_id: testServiceId,
      drip_feed_enabled: true,
      drip_feed_runs: 5,
      drip_feed_interval: 60
    };

    await expect(createOrder(input, testUserId)).rejects.toThrow(/service does not support drip feed/i);
  });

  it('should throw error for drip feed without runs and interval', async () => {
    testUserId = await createTestUser(100);
    testServiceId = await createTestService({ supportsDripFeed: true });

    const input: CreateOrderInput = {
      ...testInput,
      service_id: testServiceId,
      drip_feed_enabled: true
      // Missing drip_feed_runs and drip_feed_interval
    };

    await expect(createOrder(input, testUserId)).rejects.toThrow(/drip feed runs and interval are required/i);
  });
});
