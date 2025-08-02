
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { transactionsTable, usersTable } from '../db/schema';
import { type CreateTransactionInput } from '../schema';
import { createTransaction } from '../handlers/create_transaction';
import { eq } from 'drizzle-orm';

// Test user data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password_hash: 'hashedpassword',
  balance: '100.00',
  role: 'user' as const
};

describe('createTransaction', () => {
  let userId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create a test user first (required for foreign key)
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    userId = userResult[0].id;
  });

  afterEach(resetDB);

  it('should create a deposit transaction', async () => {
    const testInput: CreateTransactionInput = {
      user_id: userId,
      type: 'deposit',
      amount: 50.00,
      description: 'Bitcoin deposit',
      crypto_currency: 'BTC',
      crypto_address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      crypto_tx_hash: 'abc123'
    };

    const result = await createTransaction(testInput);

    // Basic field validation
    expect(result.user_id).toEqual(userId);
    expect(result.type).toEqual('deposit');
    expect(result.amount).toEqual(50.00);
    expect(typeof result.amount).toBe('number');
    expect(result.description).toEqual('Bitcoin deposit');
    expect(result.crypto_currency).toEqual('BTC');
    expect(result.crypto_address).toEqual('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
    expect(result.crypto_tx_hash).toEqual('abc123');
    expect(result.status).toEqual('pending');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create an order transaction', async () => {
    const testInput: CreateTransactionInput = {
      user_id: userId,
      type: 'order',
      amount: 25.50,
      description: 'Payment for Instagram likes service'
    };

    const result = await createTransaction(testInput);

    expect(result.user_id).toEqual(userId);
    expect(result.type).toEqual('order');
    expect(result.amount).toEqual(25.50);
    expect(result.description).toEqual('Payment for Instagram likes service');
    expect(result.crypto_currency).toBeNull();
    expect(result.crypto_address).toBeNull();
    expect(result.crypto_tx_hash).toBeNull();
    expect(result.status).toEqual('pending');
  });

  it('should create a refund transaction', async () => {
    const testInput: CreateTransactionInput = {
      user_id: userId,
      type: 'refund',
      amount: 15.75,
      description: 'Refund for cancelled order #123'
    };

    const result = await createTransaction(testInput);

    expect(result.user_id).toEqual(userId);
    expect(result.type).toEqual('refund');
    expect(result.amount).toEqual(15.75);
    expect(result.description).toEqual('Refund for cancelled order #123');
    expect(result.status).toEqual('pending');
  });

  it('should save transaction to database', async () => {
    const testInput: CreateTransactionInput = {
      user_id: userId,
      type: 'deposit',
      amount: 100.00,
      description: 'Test deposit'
    };

    const result = await createTransaction(testInput);

    // Query using proper drizzle syntax
    const transactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, result.id))
      .execute();

    expect(transactions).toHaveLength(1);
    expect(transactions[0].user_id).toEqual(userId);
    expect(transactions[0].type).toEqual('deposit');
    expect(parseFloat(transactions[0].amount)).toEqual(100.00);
    expect(transactions[0].description).toEqual('Test deposit');
    expect(transactions[0].status).toEqual('pending');
    expect(transactions[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle crypto transaction with all fields', async () => {
    const testInput: CreateTransactionInput = {
      user_id: userId,
      type: 'deposit',
      amount: 10.50, // Use a value with more precision that works well with numeric(10,2)
      description: 'Bitcoin deposit',
      crypto_currency: 'BTC',
      crypto_address: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
      crypto_tx_hash: 'def456789'
    };

    const result = await createTransaction(testInput);

    expect(result.crypto_currency).toEqual('BTC');
    expect(result.crypto_address).toEqual('3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy');
    expect(result.crypto_tx_hash).toEqual('def456789');
    expect(result.amount).toEqual(10.50);
    expect(typeof result.amount).toBe('number');
  });

  it('should throw error for non-existent user', async () => {
    const testInput: CreateTransactionInput = {
      user_id: 99999, // Non-existent user ID
      type: 'deposit',
      amount: 50.00,
      description: 'Test deposit'
    };

    await expect(createTransaction(testInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
