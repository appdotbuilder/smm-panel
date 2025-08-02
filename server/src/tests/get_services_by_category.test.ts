
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, servicesTable } from '../db/schema';
import { type CreateCategoryInput, type CreateServiceInput } from '../schema';
import { getServicesByCategory } from '../handlers/get_services_by_category';

// Test data
const testCategory: CreateCategoryInput = {
  name: 'Social Media',
  description: 'Social media services'
};

const testService1: CreateServiceInput = {
  category_id: 1, // Will be updated after category creation
  name: 'Instagram Followers',
  description: 'High quality Instagram followers',
  price_per_unit: 0.005,
  min_quantity: 100,
  max_quantity: 10000,
  average_delivery_time: 24,
  supports_drip_feed: true
};

const testService2: CreateServiceInput = {
  category_id: 1, // Will be updated after category creation
  name: 'Instagram Likes',
  description: 'Fast Instagram likes delivery',
  price_per_unit: 0.002,
  min_quantity: 50,
  max_quantity: 5000,
  average_delivery_time: 12,
  supports_drip_feed: false
};

describe('getServicesByCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return active services for a category', async () => {
    // Create category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: testCategory.name,
        description: testCategory.description
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create services
    await db.insert(servicesTable)
      .values([
        {
          ...testService1,
          category_id: categoryId,
          price_per_unit: testService1.price_per_unit.toString()
        },
        {
          ...testService2,
          category_id: categoryId,
          price_per_unit: testService2.price_per_unit.toString()
        }
      ])
      .execute();

    const result = await getServicesByCategory(categoryId);

    expect(result).toHaveLength(2);
    
    // Verify first service
    const service1 = result.find(s => s.name === 'Instagram Followers');
    expect(service1).toBeDefined();
    expect(service1!.category_id).toEqual(categoryId);
    expect(service1!.price_per_unit).toEqual(0.005);
    expect(typeof service1!.price_per_unit).toEqual('number');
    expect(service1!.min_quantity).toEqual(100);
    expect(service1!.supports_drip_feed).toEqual(true);
    expect(service1!.is_active).toEqual(true);

    // Verify second service
    const service2 = result.find(s => s.name === 'Instagram Likes');
    expect(service2).toBeDefined();
    expect(service2!.category_id).toEqual(categoryId);
    expect(service2!.price_per_unit).toEqual(0.002);
    expect(typeof service2!.price_per_unit).toEqual('number');
    expect(service2!.min_quantity).toEqual(50);
    expect(service2!.supports_drip_feed).toEqual(false);
    expect(service2!.is_active).toEqual(true);
  });

  it('should return empty array for non-existent category', async () => {
    const result = await getServicesByCategory(999);
    expect(result).toHaveLength(0);
  });

  it('should only return active services', async () => {
    // Create category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: testCategory.name,
        description: testCategory.description
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create active and inactive services
    await db.insert(servicesTable)
      .values([
        {
          ...testService1,
          category_id: categoryId,
          price_per_unit: testService1.price_per_unit.toString(),
          is_active: true
        },
        {
          ...testService2,
          category_id: categoryId,
          price_per_unit: testService2.price_per_unit.toString(),
          is_active: false
        }
      ])
      .execute();

    const result = await getServicesByCategory(categoryId);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Instagram Followers');
    expect(result[0].is_active).toEqual(true);
  });

  it('should return empty array for category with no services', async () => {
    // Create category without services
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: testCategory.name,
        description: testCategory.description
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    const result = await getServicesByCategory(categoryId);
    expect(result).toHaveLength(0);
  });
});
