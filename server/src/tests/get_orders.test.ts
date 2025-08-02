
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, servicesTable, ordersTable } from '../db/schema';
import { getOrders } from '../handlers/get_orders';

describe('getOrders', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all orders when no userId provided', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          username: 'user1',
          email: 'user1@example.com',
          password_hash: 'hash1'
        },
        {
          username: 'user2',
          email: 'user2@example.com',
          password_hash: 'hash2'
        }
      ])
      .returning()
      .execute();

    // Create test category
    const category = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A test category'
      })
      .returning()
      .execute();

    // Create test service
    const service = await db.insert(servicesTable)
      .values({
        category_id: category[0].id,
        name: 'Test Service',
        description: 'A test service',
        price_per_unit: '0.001',
        min_quantity: 100,
        max_quantity: 10000,
        average_delivery_time: 24
      })
      .returning()
      .execute();

    // Create test orders for both users
    await db.insert(ordersTable)
      .values([
        {
          user_id: users[0].id,
          service_id: service[0].id,
          quantity: 1000,
          total_price: '1.00',
          target_url: 'https://example.com/post1',
          status: 'pending'
        },
        {
          user_id: users[1].id,
          service_id: service[0].id,
          quantity: 2000,
          total_price: '2.00',
          target_url: 'https://example.com/post2',
          status: 'completed'
        }
      ])
      .execute();

    const result = await getOrders();

    expect(result).toHaveLength(2);
    expect(result[0].user_id).toEqual(users[0].id);
    expect(result[0].total_price).toEqual(1.00);
    expect(typeof result[0].total_price).toBe('number');
    expect(result[1].user_id).toEqual(users[1].id);
    expect(result[1].total_price).toEqual(2.00);
    expect(typeof result[1].total_price).toBe('number');
  });

  it('should return only user orders when userId provided', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          username: 'user1',
          email: 'user1@example.com',
          password_hash: 'hash1'
        },
        {
          username: 'user2',
          email: 'user2@example.com',
          password_hash: 'hash2'
        }
      ])
      .returning()
      .execute();

    // Create test category
    const category = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A test category'
      })
      .returning()
      .execute();

    // Create test service
    const service = await db.insert(servicesTable)
      .values({
        category_id: category[0].id,
        name: 'Test Service',
        description: 'A test service',
        price_per_unit: '0.001',
        min_quantity: 100,
        max_quantity: 10000,
        average_delivery_time: 24
      })
      .returning()
      .execute();

    // Create test orders for both users
    await db.insert(ordersTable)
      .values([
        {
          user_id: users[0].id,
          service_id: service[0].id,
          quantity: 1000,
          total_price: '1.00',
          target_url: 'https://example.com/post1',
          status: 'pending'
        },
        {
          user_id: users[0].id,
          service_id: service[0].id,
          quantity: 1500,
          total_price: '1.50',
          target_url: 'https://example.com/post2',
          status: 'in_progress'
        },
        {
          user_id: users[1].id,
          service_id: service[0].id,
          quantity: 2000,
          total_price: '2.00',
          target_url: 'https://example.com/post3',
          status: 'completed'
        }
      ])
      .execute();

    const result = await getOrders(users[0].id);

    expect(result).toHaveLength(2);
    result.forEach(order => {
      expect(order.user_id).toEqual(users[0].id);
      expect(typeof order.total_price).toBe('number');
    });

    expect(result[0].total_price).toEqual(1.00);
    expect(result[1].total_price).toEqual(1.50);
  });

  it('should return empty array when user has no orders', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        username: 'user1',
        email: 'user1@example.com',
        password_hash: 'hash1'
      })
      .returning()
      .execute();

    const result = await getOrders(user[0].id);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array when no orders exist', async () => {
    const result = await getOrders();

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle userId of 0 correctly', async () => {
    // Create test user with different ID
    const user = await db.insert(usersTable)
      .values({
        username: 'user1',
        email: 'user1@example.com',
        password_hash: 'hash1'
      })
      .returning()
      .execute();

    // Create test category and service
    const category = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A test category'
      })
      .returning()
      .execute();

    const service = await db.insert(servicesTable)
      .values({
        category_id: category[0].id,
        name: 'Test Service',
        description: 'A test service',
        price_per_unit: '0.001',
        min_quantity: 100,
        max_quantity: 10000,
        average_delivery_time: 24
      })
      .returning()
      .execute();

    // Create order for the user
    await db.insert(ordersTable)
      .values({
        user_id: user[0].id,
        service_id: service[0].id,
        quantity: 1000,
        total_price: '1.00',
        target_url: 'https://example.com/post1',
        status: 'pending'
      })
      .execute();

    // Query for userId 0 (should return empty array)
    const result = await getOrders(0);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });
});
