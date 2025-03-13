"use server";

import { Client } from "@neondatabase/serverless";
import { generateUniqueToken } from "@/lib/generateUniqueToken";
import { sendVerificationEmail } from "@/lib/send-emails/email";

export async function subscribeUser(
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  const email = formData.get("email") as string;
  if (!email) {
    return {
      success: false,
      message: "Email is required",
    };
  }

  const client = new Client(process.env.DATABASE_URL);
  await client.connect();

  try {
    // Start transaction
    await client.query("BEGIN");
    console.log("🔄 Database transaction started.");

    const userId = await insertSubscriber(client, email);
    const { token, tokenHash } = await generateUniqueToken(client);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24-hour expiration

    await insertVerificationToken(client, userId, tokenHash, expiresAt);

    const verificationUrl = `${process.env.FRONTEND_DOMAIN_URL}/verify-email?token=${token}`;
    await sendVerificationEmail(email, verificationUrl).catch(console.error);

    // Commit transaction
    await client.query("COMMIT");
    console.log("✅ Subscription transaction committed successfully.");

    return {
      success: true,
      message: "Check your email to confirm your subscription",
    };
  } catch (error: unknown) {
    await client.query("ROLLBACK");
    console.error("❌ Transaction failed, rolling back changes:", error);

    if (error instanceof Error && error.message.includes("duplicate")) {
      return {
        success: false,
        message: "Email already subscribed.",
      };
    } else {
      return {
        success: false,
        message: "Failed to subscribe. Please try again.",
      };
    }
  } finally {
    await client.end();
  }
}

/**
 * Inserts a new subscriber into the database.
 */
const insertSubscriber = async (
  client: Client,
  email: string,
): Promise<number> => {
  console.log(`🔄 Adding new subscriber with email: ${email}`);
  const result = await client.query(
    `
      INSERT INTO ${process.env.SUBSCRIBERS_TABLE_NAME} 
      (email, preferences)
      VALUES ($1, $2) 
      RETURNING id;
      `,
    [email, JSON.stringify({ updates: true, promotions: true })],
  );

  const userId = result.rows[0]?.id;
  if (!userId) {
    throw new Error("Failed to retrieve subscriber ID after insertion.");
  }

  console.log(`✅ Subscriber added successfully with ID: ${userId}`);
  return userId;
};

/**
 * Inserts a verification token into the database.
 */
const insertVerificationToken = async (
  client: Client,
  userId: number,
  tokenHash: string,
  expiresAt: Date,
) => {
  console.log(`🔄 Adding verification token for user ID: ${userId}`);
  await client.query(
    `
      INSERT INTO ${process.env.TOKEN_TABLE_NAME} 
      (user_id, token_hash, token_type, expires_at, used, created_at, updated_at)
      VALUES ($1, $2, 'email_verification', $3, false, NOW(), NOW());
      `,
    [userId, tokenHash, expiresAt],
  );
  console.log("✅ Verification token added successfully.");
};
