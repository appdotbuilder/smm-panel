
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput } from '../schema';
import { updateUser } from '../handlers/update_user';
import { eq } from 'drizzle-orm';

describe('updateUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;

  beforeEach(async () => {
    // Create a test user directly in database
    const result = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password_123',
        balance: '0',
        role: 'user'
      })
      .returning()
      .execute();
    
    testUserId = result[0].id;
  });

  it('should update user username', async () => {
    const updateInput: UpdateUserInput = {
      id: testUserId,
      username: 'updateduser'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(testUserId);
    expect(result.username).toEqual('updateduser');
    expect(result.email).toEqual('test@example.com'); // Should remain unchanged
    expect(result.role).toEqual('user'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update user email', async () => {
    const updateInput: UpdateUserInput = {
      id: testUserId,
      email: 'newemail@example.com'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(testUserId);
    expect(result.email).toEqual('newemail@example.com');
    expect(result.username).toEqual('testuser'); // Should remain unchanged
  });

  it('should update user balance', async () => {
    const updateInput: UpdateUserInput = {
      id: testUserId,
      balance: 150.75
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(testUserId);
    expect(result.balance).toEqual(150.75);
    expect(typeof result.balance).toEqual('number');
  });

  it('should update user role', async () => {
    const updateInput: UpdateUserInput = {
      id: testUserId,
      role: 'admin'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(testUserId);
    expect(result.role).toEqual('admin');
  });

  it('should update multiple fields at once', async () => {
    const updateInput: UpdateUserInput = {
      id: testUserId,
      username: 'multiupdate',
      email: 'multi@example.com',
      balance: 99.99,
      role: 'admin'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(testUserId);
    expect(result.username).toEqual('multiupdate');
    expect(result.email).toEqual('multi@example.com');
    expect(result.balance).toEqual(99.99);
    expect(result.role).toEqual('admin');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save changes to database', async () => {
    const updateInput: UpdateUserInput = {
      id: testUserId,
      username: 'dbtest',
      balance: 200.50
    };

    await updateUser(updateInput);

    // Query database directly to verify changes
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, testUserId))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].username).toEqual('dbtest');
    expect(parseFloat(users[0].balance)).toEqual(200.50);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent user', async () => {
    const updateInput: UpdateUserInput = {
      id: 99999,
      username: 'nonexistent'
    };

    expect(updateUser(updateInput)).rejects.toThrow(/user not found/i);
  });

  it('should handle partial updates correctly', async () => {
    // Update only balance
    const updateInput: UpdateUserInput = {
      id: testUserId,
      balance: 75.25
    };

    const result = await updateUser(updateInput);

    expect(result.balance).toEqual(75.25);
    expect(result.username).toEqual('testuser'); // Original value preserved
    expect(result.email).toEqual('test@example.com'); // Original value preserved
    expect(result.role).toEqual('user'); // Original value preserved
  });
});
