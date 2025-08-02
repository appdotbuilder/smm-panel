
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { loginUser } from '../handlers/login_user';

// Test user data
const testUserData = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  role: 'user' as const
};

const testLoginInput: LoginInput = {
  email: 'test@example.com',
  password: 'password123'
};

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should login user with valid credentials', async () => {
    // Create test user with hashed password
    const hashedPassword = await Bun.password.hash(testUserData.password);
    
    await db.insert(usersTable)
      .values({
        username: testUserData.username,
        email: testUserData.email,
        password_hash: hashedPassword,
        role: testUserData.role
      })
      .execute();

    const result = await loginUser(testLoginInput);

    expect(result).not.toBeNull();
    expect(result!.email).toEqual('test@example.com');
    expect(result!.username).toEqual('testuser');
    expect(result!.role).toEqual('user');
    expect(result!.balance).toEqual(0); // Default balance
    expect(typeof result!.balance).toBe('number');
    expect(result!.id).toBeDefined();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent email', async () => {
    const invalidInput: LoginInput = {
      email: 'nonexistent@example.com',
      password: 'password123'
    };

    const result = await loginUser(invalidInput);

    expect(result).toBeNull();
  });

  it('should return null for invalid password', async () => {
    // Create test user
    const hashedPassword = await Bun.password.hash(testUserData.password);
    
    await db.insert(usersTable)
      .values({
        username: testUserData.username,
        email: testUserData.email,
        password_hash: hashedPassword,
        role: testUserData.role
      })
      .execute();

    const invalidInput: LoginInput = {
      email: 'test@example.com',
      password: 'wrongpassword'
    };

    const result = await loginUser(invalidInput);

    expect(result).toBeNull();
  });

  it('should handle user with custom balance', async () => {
    // Create test user with custom balance
    const hashedPassword = await Bun.password.hash(testUserData.password);
    
    await db.insert(usersTable)
      .values({
        username: testUserData.username,
        email: testUserData.email,
        password_hash: hashedPassword,
        role: testUserData.role,
        balance: '150.75' // Custom balance as string (numeric column)
      })
      .execute();

    const result = await loginUser(testLoginInput);

    expect(result).not.toBeNull();
    expect(result!.balance).toEqual(150.75);
    expect(typeof result!.balance).toBe('number');
  });

  it('should login admin user successfully', async () => {
    // Create admin user
    const hashedPassword = await Bun.password.hash(testUserData.password);
    
    await db.insert(usersTable)
      .values({
        username: 'adminuser',
        email: 'admin@example.com',
        password_hash: hashedPassword,
        role: 'admin'
      })
      .execute();

    const adminInput: LoginInput = {
      email: 'admin@example.com',
      password: 'password123'
    };

    const result = await loginUser(adminInput);

    expect(result).not.toBeNull();
    expect(result!.role).toEqual('admin');
    expect(result!.username).toEqual('adminuser');
  });
});
