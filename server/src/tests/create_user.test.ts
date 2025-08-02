
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  role: 'user'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user with default role', async () => {
    const inputWithoutRole = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    };

    const result = await createUser(inputWithoutRole);

    // Basic field validation
    expect(result.username).toEqual('testuser');
    expect(result.email).toEqual('test@example.com');
    expect(result.role).toEqual('user');
    expect(result.balance).toEqual(0);
    expect(typeof result.balance).toEqual('number');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.api_key).toBeNull();
  });

  it('should create a user with specified role', async () => {
    const adminInput = {
      ...testInput,
      role: 'admin' as const
    };

    const result = await createUser(adminInput);

    expect(result.username).toEqual('testuser');
    expect(result.email).toEqual('test@example.com');
    expect(result.role).toEqual('admin');
    expect(result.balance).toEqual(0);
    expect(result.id).toBeDefined();
  });

  it('should hash the password', async () => {
    const result = await createUser(testInput);

    expect(result.password_hash).toBeDefined();
    expect(result.password_hash).not.toEqual('password123');
    expect(result.password_hash.length).toBeGreaterThan(10);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].username).toEqual('testuser');
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].role).toEqual('user');
    expect(parseFloat(users[0].balance)).toEqual(0);
    expect(users[0].password_hash).toBeDefined();
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should verify password can be validated', async () => {
    const result = await createUser(testInput);

    // Verify that the hashed password can be validated
    const isValid = await Bun.password.verify('password123', result.password_hash);
    expect(isValid).toBe(true);

    const isInvalid = await Bun.password.verify('wrongpassword', result.password_hash);
    expect(isInvalid).toBe(false);
  });

  it('should handle unique constraint violations', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create user with same username
    const duplicateUsernameInput = {
      ...testInput,
      email: 'different@example.com'
    };

    await expect(createUser(duplicateUsernameInput)).rejects.toThrow();

    // Try to create user with same email
    const duplicateEmailInput = {
      ...testInput,
      username: 'differentuser',
      email: testInput.email
    };

    await expect(createUser(duplicateEmailInput)).rejects.toThrow();
  });
});
