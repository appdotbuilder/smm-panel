
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, transactionsTable } from '../db/schema';
import { getTransactions } from '../handlers/get_transactions';

describe('getTransactions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all transactions when no userId provided', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          username: 'user1',
          email: 'user1@example.com',
          password_hash: 'hash1'
        },
        {
          username: 'user2',
          email: 'user2@example.com',
          password_hash: 'hash2'
        }
      ])
      .returning()
      .execute();

    // Create transactions for both users
    await db.insert(transactionsTable)
      .values([
        {
          user_id: users[0].id,
          type: 'deposit',
          amount: '100.50',
          description: 'Test deposit 1'
        },
        {
          user_id: users[1].id,
          type: 'order',
          amount: '25.75',
          description: 'Test order 1'
        },
        {
          user_id: users[0].id,
          type: 'refund',
          amount: '15.00',
          description: 'Test refund 1'
        }
      ])
      .execute();

    const result = await getTransactions();

    expect(result).toHaveLength(3);
    expect(result[0].amount).toEqual(100.50);
    expect(result[1].amount).toEqual(25.75);
    expect(result[2].amount).toEqual(15.00);
    expect(typeof result[0].amount).toBe('number');
  });

  it('should return only user transactions when userId provided', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          username: 'user1',
          email: 'user1@example.com',
          password_hash: 'hash1'
        },
        {
          username: 'user2',
          email: 'user2@example.com',
          password_hash: 'hash2'
        }
      ])
      .returning()
      .execute();

    // Create transactions for both users
    await db.insert(transactionsTable)
      .values([
        {
          user_id: users[0].id,
          type: 'deposit',
          amount: '100.50',
          description: 'User 1 deposit'
        },
        {
          user_id: users[1].id,
          type: 'order',
          amount: '25.75',
          description: 'User 2 order'
        },
        {
          user_id: users[0].id,
          type: 'refund',
          amount: '15.00',
          description: 'User 1 refund'
        }
      ])
      .execute();

    const result = await getTransactions(users[0].id);

    expect(result).toHaveLength(2);
    expect(result.every(t => t.user_id === users[0].id)).toBe(true);
    expect(result[0].description).toEqual('User 1 deposit');
    expect(result[1].description).toEqual('User 1 refund');
    expect(result[0].amount).toEqual(100.50);
    expect(result[1].amount).toEqual(15.00);
  });

  it('should return empty array when user has no transactions', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        username: 'user1',
        email: 'user1@example.com',
        password_hash: 'hash1'
      })
      .returning()
      .execute();

    const result = await getTransactions(user[0].id);

    expect(result).toHaveLength(0);
  });

  it('should return empty array when no transactions exist', async () => {
    const result = await getTransactions();

    expect(result).toHaveLength(0);
  });

  it('should include all transaction fields', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash'
      })
      .returning()
      .execute();

    // Create transaction with all fields
    await db.insert(transactionsTable)
      .values({
        user_id: user[0].id,
        type: 'deposit',
        amount: '50.25',
        description: 'Crypto deposit',
        crypto_currency: 'BTC',
        crypto_address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        crypto_tx_hash: 'abc123',
        status: 'completed'
      })
      .execute();

    const result = await getTransactions(user[0].id);

    expect(result).toHaveLength(1);
    const transaction = result[0];
    
    expect(transaction.id).toBeDefined();
    expect(transaction.user_id).toEqual(user[0].id);
    expect(transaction.type).toEqual('deposit');
    expect(transaction.amount).toEqual(50.25);
    expect(transaction.description).toEqual('Crypto deposit');
    expect(transaction.crypto_currency).toEqual('BTC');
    expect(transaction.crypto_address).toEqual('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
    expect(transaction.crypto_tx_hash).toEqual('abc123');
    expect(transaction.status).toEqual('completed');
    expect(transaction.created_at).toBeInstanceOf(Date);
  });
});
