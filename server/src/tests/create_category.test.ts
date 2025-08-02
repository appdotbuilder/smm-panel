
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { createCategory } from '../handlers/create_category';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateCategoryInput = {
  name: 'Social Media',
  description: 'Services for social media platforms'
};

const testInputNoDescription: CreateCategoryInput = {
  name: 'SEO Services'
};

describe('createCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a category with description', async () => {
    const result = await createCategory(testInput);

    // Basic field validation
    expect(result.name).toEqual('Social Media');
    expect(result.description).toEqual('Services for social media platforms');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a category without description', async () => {
    const result = await createCategory(testInputNoDescription);

    // Basic field validation
    expect(result.name).toEqual('SEO Services');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save category to database', async () => {
    const result = await createCategory(testInput);

    // Query using proper drizzle syntax
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Social Media');
    expect(categories[0].description).toEqual('Services for social media platforms');
    expect(categories[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle unique name constraint violation', async () => {
    // Create first category
    await createCategory(testInput);

    // Try to create another category with the same name
    await expect(createCategory(testInput)).rejects.toThrow(/unique|duplicate/i);
  });
});
