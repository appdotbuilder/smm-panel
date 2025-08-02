
import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { type Transaction } from '../schema';
import { eq } from 'drizzle-orm';

export async function getTransactions(userId?: number): Promise<Transaction[]> {
  try {
    let results;

    if (userId !== undefined) {
      // Query with filter
      results = await db.select()
        .from(transactionsTable)
        .where(eq(transactionsTable.user_id, userId))
        .execute();
    } else {
      // Query without filter
      results = await db.select()
        .from(transactionsTable)
        .execute();
    }

    // Convert numeric fields back to numbers
    return results.map(transaction => ({
      ...transaction,
      amount: parseFloat(transaction.amount)
    }));
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    throw error;
  }
}
