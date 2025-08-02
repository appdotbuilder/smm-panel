
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { getUsers } from '../handlers/get_users';
import { type CreateUserInput } from '../schema';

const testUser1: CreateUserInput = {
  username: 'testuser1',
  email: 'test1@example.com',
  password: 'password123',
  role: 'user'
};

const testUser2: CreateUserInput = {
  username: 'testuser2',
  email: 'test2@example.com',
  password: 'password456',
  role: 'admin'
};

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();

    expect(result).toEqual([]);
  });

  it('should return all users', async () => {
    // Create test users directly in database
    await db.insert(usersTable).values([
      {
        username: testUser1.username,
        email: testUser1.email,
        password_hash: 'hashed_password_1',
        balance: '100.50',
        role: testUser1.role!
      },
      {
        username: testUser2.username,
        email: testUser2.email,
        password_hash: 'hashed_password_2',
        balance: '250.75',
        role: testUser2.role!
      }
    ]).execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    expect(result[0].username).toEqual('testuser1');
    expect(result[0].email).toEqual('test1@example.com');
    expect(result[0].balance).toEqual(100.50);
    expect(typeof result[0].balance).toBe('number');
    expect(result[0].role).toEqual('user');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    expect(result[1].username).toEqual('testuser2');
    expect(result[1].email).toEqual('test2@example.com');
    expect(result[1].balance).toEqual(250.75);
    expect(typeof result[1].balance).toBe('number');
    expect(result[1].role).toEqual('admin');
  });

  it('should return users with correct field types', async () => {
    // Create a single test user
    await db.insert(usersTable).values({
      username: 'typetest',
      email: 'type@example.com',
      password_hash: 'hashed_password',
      balance: '99.99',
      role: 'user'
    }).execute();

    const result = await getUsers();

    expect(result).toHaveLength(1);
    const user = result[0];
    
    // Verify all field types
    expect(typeof user.id).toBe('number');
    expect(typeof user.username).toBe('string');
    expect(typeof user.email).toBe('string');
    expect(typeof user.password_hash).toBe('string');
    expect(typeof user.balance).toBe('number');
    expect(typeof user.role).toBe('string');
    expect(user.api_key).toBeNull();
    expect(user.created_at).toBeInstanceOf(Date);
    expect(user.updated_at).toBeInstanceOf(Date);
  });

  it('should handle users with api_key correctly', async () => {
    // Create user with api_key
    await db.insert(usersTable).values({
      username: 'apiuser',
      email: 'api@example.com',
      password_hash: 'hashed_password',
      balance: '0.00',
      role: 'admin',
      api_key: 'test-api-key-123'
    }).execute();

    const result = await getUsers();

    expect(result).toHaveLength(1);
    expect(result[0].api_key).toEqual('test-api-key-123');
    expect(result[0].username).toEqual('apiuser');
    expect(result[0].role).toEqual('admin');
  });
});
