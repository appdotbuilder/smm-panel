
import { db } from '../db';
import { servicesTable } from '../db/schema';
import { type CreateServiceInput, type Service } from '../schema';

export const createService = async (input: CreateServiceInput): Promise<Service> => {
  try {
    // Insert service record
    const result = await db.insert(servicesTable)
      .values({
        category_id: input.category_id,
        name: input.name,
        description: input.description,
        price_per_unit: input.price_per_unit.toString(), // Convert number to string for numeric column
        min_quantity: input.min_quantity,
        max_quantity: input.max_quantity,
        average_delivery_time: input.average_delivery_time,
        supports_drip_feed: input.supports_drip_feed
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const service = result[0];
    return {
      ...service,
      price_per_unit: parseFloat(service.price_per_unit) // Convert string back to number
    };
  } catch (error) {
    console.error('Service creation failed:', error);
    throw error;
  }
};
