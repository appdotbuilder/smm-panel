
import { db } from '../db';
import { servicesTable } from '../db/schema';
import { type UpdateServiceInput, type Service } from '../schema';
import { eq } from 'drizzle-orm';

export const updateService = async (input: UpdateServiceInput): Promise<Service> => {
  try {
    // First check if service exists
    const existingService = await db.select()
      .from(servicesTable)
      .where(eq(servicesTable.id, input.id))
      .execute();

    if (existingService.length === 0) {
      throw new Error(`Service with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {};

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.price_per_unit !== undefined) {
      updateData.price_per_unit = input.price_per_unit.toString();
    }
    if (input.min_quantity !== undefined) {
      updateData.min_quantity = input.min_quantity;
    }
    if (input.max_quantity !== undefined) {
      updateData.max_quantity = input.max_quantity;
    }
    if (input.average_delivery_time !== undefined) {
      updateData.average_delivery_time = input.average_delivery_time;
    }
    if (input.supports_drip_feed !== undefined) {
      updateData.supports_drip_feed = input.supports_drip_feed;
    }
    if (input.is_active !== undefined) {
      updateData.is_active = input.is_active;
    }

    // Update the updated_at timestamp
    updateData.updated_at = new Date();

    // Perform the update
    const result = await db.update(servicesTable)
      .set(updateData)
      .where(eq(servicesTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers
    const service = result[0];
    return {
      ...service,
      price_per_unit: parseFloat(service.price_per_unit)
    };
  } catch (error) {
    console.error('Service update failed:', error);
    throw error;
  }
};
