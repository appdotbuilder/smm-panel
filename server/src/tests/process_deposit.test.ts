
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { transactionsTable, usersTable } from '../db/schema';
import { type CreateTransactionInput, type CreateUserInput } from '../schema';
import { processDeposit } from '../handlers/process_deposit';
import { eq } from 'drizzle-orm';

// Test user data
const testUser: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  role: 'user'
};

// Valid transaction data
const validDepositData: Omit<CreateTransactionInput, 'user_id'> = {
  type: 'deposit',
  amount: 100.50,
  description: 'Bitcoin deposit',
  crypto_currency: 'BTC',
  crypto_address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
  crypto_tx_hash: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890'
};

describe('processDeposit', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should process a valid deposit transaction', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        password_hash: 'hashed_password',
        balance: '50.00',
        role: 'user'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create pending deposit transaction
    const transactionResult = await db.insert(transactionsTable)
      .values({
        user_id: userId,
        type: validDepositData.type,
        amount: validDepositData.amount.toString(),
        description: validDepositData.description,
        crypto_currency: validDepositData.crypto_currency,
        crypto_address: validDepositData.crypto_address,
        crypto_tx_hash: validDepositData.crypto_tx_hash,
        status: 'pending'
      })
      .returning()
      .execute();

    const transactionId = transactionResult[0].id;

    // Process the deposit
    const result = await processDeposit(transactionId);

    // Verify transaction was updated
    expect(result.id).toEqual(transactionId);
    expect(result.status).toEqual('completed');
    expect(result.amount).toEqual(100.50);
    expect(typeof result.amount).toEqual('number');

    // Verify user balance was updated
    const updatedUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(updatedUsers).toHaveLength(1);
    expect(parseFloat(updatedUsers[0].balance)).toEqual(150.50); // 50.00 + 100.50
  });

  it('should throw error for non-existent transaction', async () => {
    await expect(processDeposit(99999)).rejects.toThrow(/transaction not found/i);
  });

  it('should throw error for non-deposit transaction', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        password_hash: 'hashed_password',
        balance: '50.00',
        role: 'user'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create order transaction (not deposit)
    const transactionResult = await db.insert(transactionsTable)
      .values({
        user_id: userId,
        type: 'order',
        amount: '25.00',
        description: 'Service order',
        status: 'pending'
      })
      .returning()
      .execute();

    const transactionId = transactionResult[0].id;

    await expect(processDeposit(transactionId)).rejects.toThrow(/not a deposit/i);
  });

  it('should throw error for already completed transaction', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        password_hash: 'hashed_password',
        balance: '50.00',
        role: 'user'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create already completed deposit transaction
    const transactionResult = await db.insert(transactionsTable)
      .values({
        user_id: userId,
        type: 'deposit',
        amount: validDepositData.amount.toString(),
        description: validDepositData.description,
        crypto_currency: validDepositData.crypto_currency,
        crypto_address: validDepositData.crypto_address,
        crypto_tx_hash: validDepositData.crypto_tx_hash,
        status: 'completed'
      })
      .returning()
      .execute();

    const transactionId = transactionResult[0].id;

    await expect(processDeposit(transactionId)).rejects.toThrow(/already processed/i);
  });

  it('should mark transaction as failed for invalid blockchain data', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        password_hash: 'hashed_password',
        balance: '50.00',
        role: 'user'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create deposit with invalid transaction hash
    const transactionResult = await db.insert(transactionsTable)
      .values({
        user_id: userId,
        type: 'deposit',
        amount: validDepositData.amount.toString(),
        description: validDepositData.description,
        crypto_currency: validDepositData.crypto_currency,
        crypto_address: validDepositData.crypto_address,
        crypto_tx_hash: 'invalid_hash', // Invalid format
        status: 'pending'
      })
      .returning()
      .execute();

    const transactionId = transactionResult[0].id;

    await expect(processDeposit(transactionId)).rejects.toThrow(/verification failed/i);

    // Verify transaction was marked as failed
    const failedTransactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, transactionId))
      .execute();

    expect(failedTransactions[0].status).toEqual('failed');

    // Verify user balance was not updated
    const unchangedUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(parseFloat(unchangedUsers[0].balance)).toEqual(50.00); // Original balance unchanged
  });

  it('should handle missing crypto data', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        password_hash: 'hashed_password',
        balance: '50.00',
        role: 'user'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create deposit without crypto data
    const transactionResult = await db.insert(transactionsTable)
      .values({
        user_id: userId,
        type: 'deposit',
        amount: validDepositData.amount.toString(),
        description: validDepositData.description,
        status: 'pending'
        // No crypto fields
      })
      .returning()
      .execute();

    const transactionId = transactionResult[0].id;

    await expect(processDeposit(transactionId)).rejects.toThrow(/verification failed/i);

    // Verify transaction was marked as failed
    const failedTransactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, transactionId))
      .execute();

    expect(failedTransactions[0].status).toEqual('failed');
  });
});
