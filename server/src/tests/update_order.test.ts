
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, servicesTable, ordersTable } from '../db/schema';
import { type UpdateOrderInput } from '../schema';
import { updateOrder } from '../handlers/update_order';
import { eq } from 'drizzle-orm';

describe('updateOrder', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let userId: number;
  let categoryId: number;
  let serviceId: number;
  let orderId: number;

  beforeEach(async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        balance: '100.00'
      })
      .returning()
      .execute();
    userId = userResult[0].id;

    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A category for testing'
      })
      .returning()
      .execute();
    categoryId = categoryResult[0].id;

    const serviceResult = await db.insert(servicesTable)
      .values({
        category_id: categoryId,
        name: 'Test Service',
        description: 'A service for testing',
        price_per_unit: '0.001000',
        min_quantity: 100,
        max_quantity: 10000,
        average_delivery_time: 24
      })
      .returning()
      .execute();
    serviceId = serviceResult[0].id;

    const orderResult = await db.insert(ordersTable)
      .values({
        user_id: userId,
        service_id: serviceId,
        quantity: 1000,
        total_price: '1.00',
        target_url: 'https://example.com/target',
        status: 'pending'
      })
      .returning()
      .execute();
    orderId = orderResult[0].id;
  });

  it('should update order status', async () => {
    const updateInput: UpdateOrderInput = {
      id: orderId,
      status: 'in_progress'
    };

    const result = await updateOrder(updateInput);

    expect(result.id).toEqual(orderId);
    expect(result.status).toEqual('in_progress');
    expect(result.user_id).toEqual(userId);
    expect(result.service_id).toEqual(serviceId);
    expect(result.total_price).toEqual(1.00);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update start_count and remains', async () => {
    const updateInput: UpdateOrderInput = {
      id: orderId,
      status: 'in_progress',
      start_count: 5000,
      remains: 500
    };

    const result = await updateOrder(updateInput);

    expect(result.status).toEqual('in_progress');
    expect(result.start_count).toEqual(5000);
    expect(result.remains).toEqual(500);
  });

  it('should update only provided fields', async () => {
    const updateInput: UpdateOrderInput = {
      id: orderId,
      remains: 200
    };

    const result = await updateOrder(updateInput);

    // Only remains should be updated, status should remain 'pending'
    expect(result.status).toEqual('pending');
    expect(result.remains).toEqual(200);
    expect(result.start_count).toBeNull();
  });

  it('should save changes to database', async () => {
    const updateInput: UpdateOrderInput = {
      id: orderId,
      status: 'completed',
      start_count: 10000,
      remains: 0
    };

    await updateOrder(updateInput);

    // Verify changes in database
    const orders = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.id, orderId))
      .execute();

    expect(orders).toHaveLength(1);
    expect(orders[0].status).toEqual('completed');
    expect(orders[0].start_count).toEqual(10000);
    expect(orders[0].remains).toEqual(0);
    expect(orders[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent order', async () => {
    const updateInput: UpdateOrderInput = {
      id: 99999,
      status: 'completed'
    };

    expect(updateOrder(updateInput)).rejects.toThrow(/Order with id 99999 not found/i);
  });

  it('should handle all status values', async () => {
    const statuses = ['pending', 'in_progress', 'completed', 'cancelled', 'partial'] as const;

    for (const status of statuses) {
      const updateInput: UpdateOrderInput = {
        id: orderId,
        status: status
      };

      const result = await updateOrder(updateInput);
      expect(result.status).toEqual(status);
    }
  });
});
