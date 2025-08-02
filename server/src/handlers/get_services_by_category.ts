
import { db } from '../db';
import { servicesTable } from '../db/schema';
import { type Service } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function getServicesByCategory(categoryId: number): Promise<Service[]> {
  try {
    // Query for active services in the specified category
    const results = await db.select()
      .from(servicesTable)
      .where(and(
        eq(servicesTable.category_id, categoryId),
        eq(servicesTable.is_active, true)
      ))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(service => ({
      ...service,
      price_per_unit: parseFloat(service.price_per_unit)
    }));
  } catch (error) {
    console.error('Failed to get services by category:', error);
    throw error;
  }
}
