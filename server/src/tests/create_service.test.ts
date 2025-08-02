
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { servicesTable, categoriesTable } from '../db/schema';
import { type CreateServiceInput } from '../schema';
import { createService } from '../handlers/create_service';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateServiceInput = {
  category_id: 1,
  name: 'Instagram Followers',
  description: 'High quality Instagram followers from real accounts',
  price_per_unit: 0.0015,
  min_quantity: 100,
  max_quantity: 10000,
  average_delivery_time: 24,
  supports_drip_feed: true
};

describe('createService', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a service', async () => {
    // Create prerequisite category first
    await db.insert(categoriesTable)
      .values({
        name: 'Social Media',
        description: 'Social media marketing services'
      })
      .execute();

    const result = await createService(testInput);

    // Basic field validation
    expect(result.name).toEqual('Instagram Followers');
    expect(result.description).toEqual(testInput.description);
    expect(result.category_id).toEqual(1);
    expect(result.price_per_unit).toEqual(0.0015);
    expect(typeof result.price_per_unit).toEqual('number');
    expect(result.min_quantity).toEqual(100);
    expect(result.max_quantity).toEqual(10000);
    expect(result.average_delivery_time).toEqual(24);
    expect(result.supports_drip_feed).toEqual(true);
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save service to database', async () => {
    // Create prerequisite category first
    await db.insert(categoriesTable)
      .values({
        name: 'Social Media',
        description: 'Social media marketing services'
      })
      .execute();

    const result = await createService(testInput);

    // Query using proper drizzle syntax
    const services = await db.select()
      .from(servicesTable)
      .where(eq(servicesTable.id, result.id))
      .execute();

    expect(services).toHaveLength(1);
    expect(services[0].name).toEqual('Instagram Followers');
    expect(services[0].description).toEqual(testInput.description);
    expect(parseFloat(services[0].price_per_unit)).toEqual(0.0015);
    expect(services[0].min_quantity).toEqual(100);
    expect(services[0].max_quantity).toEqual(10000);
    expect(services[0].supports_drip_feed).toEqual(true);
    expect(services[0].is_active).toEqual(true);
    expect(services[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error for invalid category_id', async () => {
    const invalidInput = {
      ...testInput,
      category_id: 999 // Non-existent category
    };

    expect(createService(invalidInput)).rejects.toThrow(/violates foreign key constraint/i);
  });

  it('should handle service with drip feed disabled', async () => {
    // Create prerequisite category first
    await db.insert(categoriesTable)
      .values({
        name: 'Social Media',
        description: 'Social media marketing services'
      })
      .execute();

    const noDripFeedInput = {
      ...testInput,
      supports_drip_feed: false
    };

    const result = await createService(noDripFeedInput);

    expect(result.supports_drip_feed).toEqual(false);
    expect(result.name).toEqual('Instagram Followers');
    expect(result.price_per_unit).toEqual(0.0015);
  });
});
