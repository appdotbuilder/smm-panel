
import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { type CreateTransactionInput, type Transaction } from '../schema';

export const createTransaction = async (input: CreateTransactionInput): Promise<Transaction> => {
  try {
    // Insert transaction record
    const result = await db.insert(transactionsTable)
      .values({
        user_id: input.user_id,
        type: input.type,
        amount: input.amount.toString(), // Convert number to string for numeric column
        description: input.description,
        crypto_currency: input.crypto_currency || null,
        crypto_address: input.crypto_address || null,
        crypto_tx_hash: input.crypto_tx_hash || null,
        status: 'pending' // Default status
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const transaction = result[0];
    return {
      ...transaction,
      amount: parseFloat(transaction.amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Transaction creation failed:', error);
    throw error;
  }
};
