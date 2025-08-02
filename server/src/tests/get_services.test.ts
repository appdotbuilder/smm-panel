
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, servicesTable } from '../db/schema';
import { type CreateCategoryInput, type CreateServiceInput } from '../schema';
import { getServices } from '../handlers/get_services';

// Test data
const testCategory: CreateCategoryInput = {
  name: 'Social Media',
  description: 'Social media services'
};

const testService: CreateServiceInput = {
  category_id: 1, // Will be set after category creation
  name: 'Instagram Followers',
  description: 'High quality Instagram followers',
  price_per_unit: 0.001,
  min_quantity: 100,
  max_quantity: 10000,
  average_delivery_time: 24,
  supports_drip_feed: true
};

describe('getServices', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no services exist', async () => {
    const result = await getServices();
    expect(result).toEqual([]);
  });

  it('should return active services with correct data types', async () => {
    // Create category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: testCategory.name,
        description: testCategory.description
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create active service
    await db.insert(servicesTable)
      .values({
        category_id: categoryId,
        name: testService.name,
        description: testService.description,
        price_per_unit: testService.price_per_unit.toString(), // Convert to string for storage
        min_quantity: testService.min_quantity,
        max_quantity: testService.max_quantity,
        average_delivery_time: testService.average_delivery_time,
        supports_drip_feed: testService.supports_drip_feed,
        is_active: true
      })
      .execute();

    const result = await getServices();

    expect(result).toHaveLength(1);
    
    const service = result[0];
    expect(service.id).toBeDefined();
    expect(service.category_id).toEqual(categoryId);
    expect(service.name).toEqual('Instagram Followers');
    expect(service.description).toEqual(testService.description);
    expect(service.price_per_unit).toEqual(0.001);
    expect(typeof service.price_per_unit).toBe('number'); // Verify numeric conversion
    expect(service.min_quantity).toEqual(100);
    expect(service.max_quantity).toEqual(10000);
    expect(service.average_delivery_time).toEqual(24);
    expect(service.supports_drip_feed).toBe(true);
    expect(service.is_active).toBe(true);
    expect(service.created_at).toBeInstanceOf(Date);
    expect(service.updated_at).toBeInstanceOf(Date);
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

    // Create active service
    await db.insert(servicesTable)
      .values({
        category_id: categoryId,
        name: 'Active Service',
        description: 'This service is active',
        price_per_unit: '0.001',
        min_quantity: 100,
        max_quantity: 1000,
        average_delivery_time: 24,
        supports_drip_feed: false,
        is_active: true
      })
      .execute();

    // Create inactive service
    await db.insert(servicesTable)
      .values({
        category_id: categoryId,
        name: 'Inactive Service',
        description: 'This service is inactive',
        price_per_unit: '0.002',
        min_quantity: 50,
        max_quantity: 500,
        average_delivery_time: 12,
        supports_drip_feed: false,
        is_active: false
      })
      .execute();

    const result = await getServices();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Active Service');
    expect(result[0].is_active).toBe(true);
  });

  it('should return multiple active services from different categories', async () => {
    // Create two categories
    const category1Result = await db.insert(categoriesTable)
      .values({
        name: 'Social Media',
        description: 'Social media services'
      })
      .returning()
      .execute();

    const category2Result = await db.insert(categoriesTable)
      .values({
        name: 'Website Traffic',
        description: 'Website traffic services'
      })
      .returning()
      .execute();

    const category1Id = category1Result[0].id;
    const category2Id = category2Result[0].id;

    // Create services in both categories
    await db.insert(servicesTable)
      .values({
        category_id: category1Id,
        name: 'Instagram Likes',
        description: 'Quality Instagram likes',
        price_per_unit: '0.005',
        min_quantity: 50,
        max_quantity: 5000,
        average_delivery_time: 12,
        supports_drip_feed: true,
        is_active: true
      })
      .execute();

    await db.insert(servicesTable)
      .values({
        category_id: category2Id,
        name: 'Website Visitors',
        description: 'Real website visitors',
        price_per_unit: '0.01',
        min_quantity: 100,
        max_quantity: 10000,
        average_delivery_time: 48,
        supports_drip_feed: false,
        is_active: true
      })
      .execute();

    const result = await getServices();

    expect(result).toHaveLength(2);
    
    // Verify both services are returned
    const serviceNames = result.map(s => s.name);
    expect(serviceNames).toContain('Instagram Likes');
    expect(serviceNames).toContain('Website Visitors');
    
    // Verify category associations
    const instagramService = result.find(s => s.name === 'Instagram Likes');
    const trafficService = result.find(s => s.name === 'Website Visitors');
    
    expect(instagramService?.category_id).toEqual(category1Id);
    expect(trafficService?.category_id).toEqual(category2Id);
    expect(typeof instagramService?.price_per_unit).toBe('number');
    expect(typeof trafficService?.price_per_unit).toBe('number');
  });
});
