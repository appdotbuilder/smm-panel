
import { db } from '../db';
import { ordersTable, servicesTable, usersTable } from '../db/schema';
import { type CreateOrderInput, type Order } from '../schema';
import { eq } from 'drizzle-orm';

export async function createOrder(input: CreateOrderInput, userId: number): Promise<Order> {
  try {
    // Start a transaction to ensure data consistency
    return await db.transaction(async (tx) => {
      // Get user to check balance
      const users = await tx.select()
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .execute();

      if (users.length === 0) {
        throw new Error('User not found');
      }

      const user = users[0];
      const userBalance = parseFloat(user.balance);

      // Get service to validate constraints and calculate price
      const services = await tx.select()
        .from(servicesTable)
        .where(eq(servicesTable.id, input.service_id))
        .execute();

      if (services.length === 0) {
        throw new Error('Service not found');
      }

      const service = services[0];

      // Check if service is active
      if (!service.is_active) {
        throw new Error('Service is not active');
      }

      // Validate quantity constraints
      if (input.quantity < service.min_quantity) {
        throw new Error(`Quantity must be at least ${service.min_quantity}`);
      }

      if (input.quantity > service.max_quantity) {
        throw new Error(`Quantity cannot exceed ${service.max_quantity}`);
      }

      // Calculate total price
      const pricePerUnit = parseFloat(service.price_per_unit);
      const totalPrice = pricePerUnit * input.quantity;

      // Check if user has sufficient balance
      if (userBalance < totalPrice) {
        throw new Error('Insufficient balance');
      }

      // Validate drip feed settings
      if (input.drip_feed_enabled) {
        if (!service.supports_drip_feed) {
          throw new Error('Service does not support drip feed');
        }
        if (!input.drip_feed_runs || !input.drip_feed_interval) {
          throw new Error('Drip feed runs and interval are required when drip feed is enabled');
        }
      }

      // Create the order
      const orderResult = await tx.insert(ordersTable)
        .values({
          user_id: userId,
          service_id: input.service_id,
          quantity: input.quantity,
          total_price: totalPrice.toString(),
          target_url: input.target_url,
          drip_feed_enabled: input.drip_feed_enabled || false,
          drip_feed_runs: input.drip_feed_runs || null,
          drip_feed_interval: input.drip_feed_interval || null,
          status: 'pending'
        })
        .returning()
        .execute();

      // Update user balance
      const newBalance = userBalance - totalPrice;
      await tx.update(usersTable)
        .set({ 
          balance: newBalance.toString(),
          updated_at: new Date()
        })
        .where(eq(usersTable.id, userId))
        .execute();

      // Convert numeric fields back to numbers before returning
      const order = orderResult[0];
      return {
        ...order,
        total_price: parseFloat(order.total_price)
      };
    });
  } catch (error) {
    console.error('Order creation failed:', error);
    throw error;
  }
}
