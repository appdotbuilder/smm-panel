
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { getCategories } from '../handlers/get_categories';

describe('getCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no categories exist', async () => {
    const result = await getCategories();
    
    expect(result).toEqual([]);
  });

  it('should return all categories', async () => {
    // Create test categories
    const testCategories = [
      {
        name: 'Social Media',
        description: 'Social media marketing services'
      },
      {
        name: 'SEO',
        description: 'Search engine optimization'
      },
      {
        name: 'Website Traffic',
        description: null
      }
    ];

    // Insert test data
    await db.insert(categoriesTable)
      .values(testCategories)
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(3);
    
    // Check first category
    expect(result[0].name).toEqual('Social Media');
    expect(result[0].description).toEqual('Social media marketing services');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Check second category
    expect(result[1].name).toEqual('SEO');
    expect(result[1].description).toEqual('Search engine optimization');
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);

    // Check third category (null description)
    expect(result[2].name).toEqual('Website Traffic');
    expect(result[2].description).toBeNull();
    expect(result[2].id).toBeDefined();
    expect(result[2].created_at).toBeInstanceOf(Date);
  });

  it('should return categories ordered by creation time', async () => {
    // Create categories with slight delay to ensure different timestamps
    await db.insert(categoriesTable)
      .values({ name: 'First Category', description: 'First' })
      .execute();

    // Small delay to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(categoriesTable)
      .values({ name: 'Second Category', description: 'Second' })
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('First Category');
    expect(result[1].name).toEqual('Second Category');
    expect(result[0].created_at <= result[1].created_at).toBe(true);
  });
});
