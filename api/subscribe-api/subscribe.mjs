import crypto from "crypto";
import { sendVerificationEmail } from "./email.mjs";

export const handleSubscription = async (
  client,
  subscriberTableName,
  tokenTableName,
  email,
  frontendUrlBase,
  configurationSet,
  maxRetries = 5,
) => {
  let retries = 0;
  let token, tokenHash, isUnique;

  do {
    if (retries >= maxRetries) {
      throw new Error(
        "Failed to generate a unique token after multiple attempts.",
      );
    }

    token = crypto.randomBytes(32).toString("hex");
    tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const tokenCheckQuery = `
      SELECT 1 FROM ${tokenTableName} WHERE token_hash = $1;
    `;
    const tokenCheckResult = await client.query(tokenCheckQuery, [tokenHash]);

    isUnique = tokenCheckResult.rows.length === 0;
    retries++;
  } while (!isUnique);

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  try {
    const userId = await client.query(
      `
      INSERT INTO ${subscriberTableName} (email, subscribed, subscribed_at, email_verified, preferences)
      VALUES ($1, true, NOW(), false, $2) RETURNING id;
    `,
      [email, JSON.stringify({ updates: true, promotions: true })],
    );

    await client.query(
      `
      INSERT INTO ${tokenTableName} (user_id, token_hash, token_type, expires_at, used, created_at, updated_at)
      VALUES ($1, $2, 'email_verification', $3, false, NOW(), NOW());
    `,
      [userId.rows[0].id, tokenHash, expiresAt],
    );

    const verificationUrl = `${frontendUrlBase}/verify-email?token=${token}`;
    await sendVerificationEmail(email, verificationUrl, configurationSet);

    return { message: "Please verify your email." };
  } catch (error) {
    if (error.code === "23505") {
      throw new Error("This email is already subscribed.");
    }
    throw error;
  }
};
