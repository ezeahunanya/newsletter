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

  // Generate a unique token with collision handling
  do {
    if (retries >= maxRetries) {
      throw new Error(
        "Failed to generate a unique token after multiple attempts.",
      );
    }

    // Generate a random token and hash it
    token = crypto.randomBytes(32).toString("hex");
    tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Check if the token hash already exists in the database
    const tokenCheckQuery = `
      SELECT 1 FROM ${tokenTableName} WHERE token_hash = $1;
    `;
    const tokenCheckResult = await client.query(tokenCheckQuery, [tokenHash]);

    isUnique = tokenCheckResult.rows.length === 0; // Token is unique if no rows are returned
    retries++;
  } while (!isUnique);

  // Token expiration time (24 hours from now)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  try {
    // Add subscriber to the database
    const userId = await client.query(
      `
      INSERT INTO ${subscriberTableName} (email, subscribed, subscribed_at, email_verified, preferences)
      VALUES ($1, true, NOW(), false, $2) RETURNING id;
    `,
      [email, JSON.stringify({ updates: true, promotions: true })],
    );

    // Add token to the database
    await client.query(
      `
      INSERT INTO ${tokenTableName} (user_id, token_hash, token_type, expires_at, used, created_at, updated_at)
      VALUES ($1, $2, 'email_verification', $3, false, NOW(), NOW());
    `,
      [userId.rows[0].id, tokenHash, expiresAt],
    );

    // Send the verification email
    const verificationUrl = `${frontendUrlBase}/verify-email?token=${token}`;
    await sendVerificationEmail(email, verificationUrl, configurationSet);

    return { message: "Please verify your email." };
  } catch (error) {
    // Check for unique constraint violation
    if (error.code === "23505") {
      throw new Error("This email is already subscribed.");
    }
    // Rethrow any other errors
    throw error;
  }
};
