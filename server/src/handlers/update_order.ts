
import { db } from '../db';
import { ordersTable } from '../db/schema';
import { type UpdateOrderInput, type Order } from '../schema';
import { eq } from 'drizzle-orm';

export const updateOrder = async (input: UpdateOrderInput): Promise<Order> => {
  try {
    // First check if order exists
    const existingOrder = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.id, input.id))
      .execute();

    if (existingOrder.length === 0) {
      throw new Error(`Order with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.status !== undefined) {
      updateData.status = input.status;
    }
    
    if (input.start_count !== undefined) {
      updateData.start_count = input.start_count;
    }
    
    if (input.remains !== undefined) {
      updateData.remains = input.remains;
    }

    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Perform the update
    const result = await db.update(ordersTable)
      .set(updateData)
      .where(eq(ordersTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const order = result[0];
    return {
      ...order,
      total_price: parseFloat(order.total_price)
    };
  } catch (error) {
    console.error('Order update failed:', error);
    throw error;
  }
};
