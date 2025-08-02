
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, servicesTable } from '../db/schema';
import { type UpdateServiceInput } from '../schema';
import { updateService } from '../handlers/update_service';
import { eq } from 'drizzle-orm';

describe('updateService', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let categoryId: number;
  let serviceId: number;

  beforeEach(async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A category for testing'
      })
      .returning()
      .execute();
    categoryId = categoryResult[0].id;

    // Create test service
    const serviceResult = await db.insert(servicesTable)
      .values({
        category_id: categoryId,
        name: 'Test Service',
        description: 'A service for testing',
        price_per_unit: '10.99',
        min_quantity: 100,
        max_quantity: 10000,
        average_delivery_time: 24,
        supports_drip_feed: false,
        is_active: true
      })
      .returning()
      .execute();
    serviceId = serviceResult[0].id;
  });

  it('should update service name', async () => {
    const input: UpdateServiceInput = {
      id: serviceId,
      name: 'Updated Service Name'
    };

    const result = await updateService(input);

    expect(result.name).toEqual('Updated Service Name');
    expect(result.description).toEqual('A service for testing'); // unchanged
    expect(result.price_per_unit).toEqual(10.99);
    expect(result.id).toEqual(serviceId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update service pricing', async () => {
    const input: UpdateServiceInput = {
      id: serviceId,
      price_per_unit: 15.50
    };

    const result = await updateService(input);

    expect(result.price_per_unit).toEqual(15.50);
    expect(typeof result.price_per_unit).toBe('number');
    expect(result.name).toEqual('Test Service'); // unchanged
  });

  it('should update quantity limits', async () => {
    const input: UpdateServiceInput = {
      id: serviceId,
      min_quantity: 50,
      max_quantity: 20000
    };

    const result = await updateService(input);

    expect(result.min_quantity).toEqual(50);
    expect(result.max_quantity).toEqual(20000);
    expect(result.price_per_unit).toEqual(10.99); // unchanged
  });

  it('should update drip feed and active status', async () => {
    const input: UpdateServiceInput = {
      id: serviceId,
      supports_drip_feed: true,
      is_active: false
    };

    const result = await updateService(input);

    expect(result.supports_drip_feed).toBe(true);
    expect(result.is_active).toBe(false);
    expect(result.name).toEqual('Test Service'); // unchanged
  });

  it('should update multiple fields at once', async () => {
    const input: UpdateServiceInput = {
      id: serviceId,
      name: 'Multi-Update Service',
      description: 'Updated description',
      price_per_unit: 25.99,
      average_delivery_time: 48,
      is_active: false
    };

    const result = await updateService(input);

    expect(result.name).toEqual('Multi-Update Service');
    expect(result.description).toEqual('Updated description');
    expect(result.price_per_unit).toEqual(25.99);
    expect(result.average_delivery_time).toEqual(48);
    expect(result.is_active).toBe(false);
    expect(result.min_quantity).toEqual(100); // unchanged
    expect(result.max_quantity).toEqual(10000); // unchanged
  });

  it('should save changes to database', async () => {
    const input: UpdateServiceInput = {
      id: serviceId,
      name: 'Database Update Test',
      price_per_unit: 99.99
    };

    await updateService(input);

    // Verify changes were saved
    const services = await db.select()
      .from(servicesTable)
      .where(eq(servicesTable.id, serviceId))
      .execute();

    expect(services).toHaveLength(1);
    expect(services[0].name).toEqual('Database Update Test');
    expect(parseFloat(services[0].price_per_unit)).toEqual(99.99);
    expect(services[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent service', async () => {
    const input: UpdateServiceInput = {
      id: 99999,
      name: 'Non-existent Service'
    };

    expect(updateService(input)).rejects.toThrow(/service with id 99999 not found/i);
  });

  it('should handle minimal update with only id', async () => {
    const input: UpdateServiceInput = {
      id: serviceId
    };

    const result = await updateService(input);

    // Should return service with updated timestamp but same data
    expect(result.id).toEqual(serviceId);
    expect(result.name).toEqual('Test Service');
    expect(result.price_per_unit).toEqual(10.99);
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});
