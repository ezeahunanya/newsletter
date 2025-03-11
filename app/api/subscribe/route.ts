import { generateUniqueToken } from "@/lib/generateUniqueToken";
import { NextResponse } from "next/server";
import { Client } from "@neondatabase/serverless";

export async function POST(req: Request, ctx: any) {
  const client = new Client(process.env.DATABASE_URL);
  await client.connect();
  console.log("✅ Database connection established.");

  const { email } = await req.json();
  if (!email)
    return NextResponse.json({ error: "Email is required" }, { status: 400 });

  let userId;
  try {
    await client.query("BEGIN");
    console.log("🔄 Database transaction started.");

    userId = await insertSubscriber(client, email);
    const { token, tokenHash } = await generateUniqueToken(client);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Token expiration in 24 hours.

    await insertVerificationToken(client, userId, tokenHash, expiresAt);

    // ✅ Email queueing (inside the transaction)
    const verificationUrl = `${process.env.FRONTEND_DOMAIN_URL}/verify-email?token=${token}`;

    await client.query("COMMIT");
    console.log("✅ Subscription transaction committed successfully.");
    return NextResponse.json({
      message: "Check your email to confirm your subscription",
    });
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("❌ Transaction failed, rolling back changes:", error);

    if (error.code === "23505") {
      console.warn("⚠️ Duplicate email detected: Email already subscribed.");
      return NextResponse.json(
        { error: "Email already subscribed." },
        { status: 500 },
      );
    } else {
      return NextResponse.json(
        { error: "Something went wrong" },
        { status: 500 },
      );
    }
  } finally {
    ctx.waitUntil(client.end());
  }
  //await sendVerificationEmail(email, token);
}

/**
 * Inserts a new subscriber into the database.
 *
 * @param {Client} client - Database client.
 * @param {string} email - Subscriber's email.
 * @returns {Promise<number>} - Subscriber ID.
 */
const insertSubscriber = async (
  client: Client,
  email: string,
): Promise<number> => {
  console.log(`🔄 Adding new subscriber with email: ${email}`);
  const result = await client.query(
    `
    INSERT INTO ${process.env.SUBSCRIBERS_TABLE_NAME} 
    (email, subscribed, subscribed_at, email_verified, preferences)
    VALUES ($1, true, NOW(), false, $2) 
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
 *
 * @param {Client} client - Database client.
 * @param {number} userId - Subscriber ID.
 * @param {string} tokenHash - Hashed token.
 * @param {Date} expiresAt - Token expiration date.
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
