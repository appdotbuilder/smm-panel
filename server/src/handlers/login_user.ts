
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export async function loginUser(input: LoginInput): Promise<User | null> {
  try {
    // Find user by email
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (users.length === 0) {
      return null; // User not found
    }

    const user = users[0];

    // Verify password using Bun's built-in password hashing
    const isValidPassword = await Bun.password.verify(input.password, user.password_hash);

    if (!isValidPassword) {
      return null; // Invalid password
    }

    // Convert numeric fields back to numbers and return user data
    return {
      ...user,
      balance: parseFloat(user.balance)
    };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}
