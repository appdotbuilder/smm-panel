
import { db } from '../db';
import { servicesTable, categoriesTable } from '../db/schema';
import { type Service } from '../schema';
import { eq } from 'drizzle-orm';

export async function getServices(): Promise<Service[]> {
  try {
    // Get all active services with category information
    const results = await db.select()
      .from(servicesTable)
      .innerJoin(categoriesTable, eq(servicesTable.category_id, categoriesTable.id))
      .where(eq(servicesTable.is_active, true))
      .execute();

    // Map results to Service type with numeric conversions
    return results.map(result => ({
      id: result.services.id,
      category_id: result.services.category_id,
      name: result.services.name,
      description: result.services.description,
      price_per_unit: parseFloat(result.services.price_per_unit), // Convert numeric to number
      min_quantity: result.services.min_quantity,
      max_quantity: result.services.max_quantity,
      average_delivery_time: result.services.average_delivery_time,
      supports_drip_feed: result.services.supports_drip_feed,
      is_active: result.services.is_active,
      created_at: result.services.created_at,
      updated_at: result.services.updated_at
    }));
  } catch (error) {
    console.error('Failed to get services:', error);
    throw error;
  }
}
