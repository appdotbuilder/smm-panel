
import { db } from '../db';
import { ordersTable } from '../db/schema';
import { type Order } from '../schema';
import { eq } from 'drizzle-orm';

export async function getOrders(userId?: number): Promise<Order[]> {
  try {
    // Build query conditionally without reassigning
    const results = userId !== undefined
      ? await db.select().from(ordersTable).where(eq(ordersTable.user_id, userId)).execute()
      : await db.select().from(ordersTable).execute();

    // Convert numeric fields back to numbers
    return results.map(order => ({
      ...order,
      total_price: parseFloat(order.total_price)
    }));
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    throw error;
  }
}
