
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type GenerateApiKeyInput } from '../schema';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';

export async function generateApiKey(input: GenerateApiKeyInput): Promise<{ api_key: string }> {
  try {
    // Verify user exists
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (existingUser.length === 0) {
      throw new Error('User not found');
    }

    // Generate a secure random API key
    const apiKey = randomBytes(32).toString('hex');

    // Update user with new API key
    await db.update(usersTable)
      .set({ 
        api_key: apiKey,
        updated_at: new Date()
      })
      .where(eq(usersTable.id, input.user_id))
      .execute();

    return { api_key: apiKey };
  } catch (error) {
    console.error('API key generation failed:', error);
    throw error;
  }
}
