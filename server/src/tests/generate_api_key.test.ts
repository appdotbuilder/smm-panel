
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type GenerateApiKeyInput } from '../schema';
import { generateApiKey } from '../handlers/generate_api_key';
import { eq } from 'drizzle-orm';

const testInput: GenerateApiKeyInput = {
  user_id: 1
};

describe('generateApiKey', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate an API key for existing user', async () => {
    // Create a test user first
    await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        role: 'user'
      })
      .execute();

    const result = await generateApiKey(testInput);

    // Verify API key is generated
    expect(result.api_key).toBeDefined();
    expect(typeof result.api_key).toBe('string');
    expect(result.api_key.length).toBe(64); // 32 bytes * 2 (hex encoding)
    expect(result.api_key).toMatch(/^[a-f0-9]{64}$/); // Valid hex string
  });

  it('should store API key in database', async () => {
    // Create a test user first
    await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        role: 'user'
      })
      .execute();

    const result = await generateApiKey(testInput);

    // Verify API key is stored in database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, testInput.user_id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].api_key).toEqual(result.api_key);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should replace existing API key', async () => {
    // Create a test user with existing API key
    await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        role: 'user',
        api_key: 'old_api_key_12345'
      })
      .execute();

    const result = await generateApiKey(testInput);

    // Verify new API key is different and stored
    expect(result.api_key).toBeDefined();
    expect(result.api_key).not.toEqual('old_api_key_12345');

    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, testInput.user_id))
      .execute();

    expect(users[0].api_key).toEqual(result.api_key);
  });

  it('should throw error for non-existent user', async () => {
    const invalidInput: GenerateApiKeyInput = {
      user_id: 999
    };

    await expect(generateApiKey(invalidInput)).rejects.toThrow(/user not found/i);
  });

  it('should generate unique API keys', async () => {
    // Create two test users
    await db.insert(usersTable)
      .values([
        {
          username: 'testuser1',
          email: 'test1@example.com',
          password_hash: 'hashed_password',
          role: 'user'
        },
        {
          username: 'testuser2',
          email: 'test2@example.com',
          password_hash: 'hashed_password',
          role: 'user'
        }
      ])
      .execute();

    const result1 = await generateApiKey({ user_id: 1 });
    const result2 = await generateApiKey({ user_id: 2 });

    // Verify API keys are unique
    expect(result1.api_key).not.toEqual(result2.api_key);
    expect(result1.api_key.length).toBe(64);
    expect(result2.api_key.length).toBe(64);
  });
});
