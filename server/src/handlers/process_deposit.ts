
import { db } from '../db';
import { transactionsTable, usersTable } from '../db/schema';
import { type Transaction } from '../schema';
import { eq, sql } from 'drizzle-orm';

export const processDeposit = async (transactionId: number): Promise<Transaction> => {
  try {
    // Get the transaction record
    const transactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, transactionId))
      .execute();

    if (transactions.length === 0) {
      throw new Error('Transaction not found');
    }

    const transaction = transactions[0];

    // Verify it's a deposit transaction
    if (transaction.type !== 'deposit') {
      throw new Error('Transaction is not a deposit');
    }

    // Check if already processed
    if (transaction.status === 'completed') {
      throw new Error('Transaction already processed');
    }

    // In a real implementation, this would verify the blockchain transaction
    // For now, we'll simulate successful verification
    const isValidTransaction = await verifyBlockchainTransaction(transaction);

    if (!isValidTransaction) {
      // Mark transaction as failed
      await db.update(transactionsTable)
        .set({
          status: 'failed'
        })
        .where(eq(transactionsTable.id, transactionId))
        .execute();

      throw new Error('Blockchain transaction verification failed');
    }

    // Update transaction status to completed and user balance atomically
    await db.transaction(async (tx) => {
      // Update transaction status
      await tx.update(transactionsTable)
        .set({
          status: 'completed'
        })
        .where(eq(transactionsTable.id, transactionId))
        .execute();

      // Update user balance
      await tx.update(usersTable)
        .set({
          balance: sql`${usersTable.balance} + ${transaction.amount.toString()}`,
          updated_at: new Date()
        })
        .where(eq(usersTable.id, transaction.user_id))
        .execute();
    });

    // Get updated transaction record
    const updatedTransactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, transactionId))
      .execute();

    const updatedTransaction = updatedTransactions[0];

    return {
      ...updatedTransaction,
      amount: parseFloat(updatedTransaction.amount)
    };
  } catch (error) {
    console.error('Deposit processing failed:', error);
    throw error;
  }
};

// Mock blockchain verification function
// In a real implementation, this would check the blockchain for the transaction
async function verifyBlockchainTransaction(transaction: any): Promise<boolean> {
  // Simulate verification logic
  // Check if crypto_tx_hash, crypto_address, and crypto_currency are present
  if (!transaction.crypto_tx_hash || !transaction.crypto_address || !transaction.crypto_currency) {
    return false;
  }

  // Simulate successful verification for valid transaction hashes
  // In reality, this would call blockchain APIs
  // Accept hex strings of common lengths (64 or 66 characters, with or without 0x prefix)
  const validHashPattern = /^(0x)?[a-fA-F0-9]{64,66}$/;
  return validHashPattern.test(transaction.crypto_tx_hash);
}
