import crypto from "crypto";
import { sendWelcomeEmail } from "./email.mjs";

export const verifyEmail = async (
  client,
  tokenTableName,
  subscriberTableName,
  configurationSet,
  token,
) => {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  // Check if the token exists in the token table and fetch related data
  const tokenQuery = `
    SELECT t.user_id, t.expires_at, t.used, s.email
    FROM ${tokenTableName} t
    JOIN ${subscriberTableName} s ON t.user_id = s.id
    WHERE t.token_hash = $1 AND t.token_type = 'email_verification';
  `;
  const tokenResult = await client.query(tokenQuery, [tokenHash]);

  if (tokenResult.rows.length === 0) {
    throw new Error("Invalid token");
  }

  const { user_id, expires_at, used, email } = tokenResult.rows[0];

  if (used) {
    throw new Error("Token has already been used: email already verified");
  }

  const currentTime = new Date();
  if (currentTime > new Date(expires_at)) {
    throw new Error("Token has expired");
  }

  // Mark email as verified in the subscriber table
  const updateQuery = `
    UPDATE ${subscriberTableName}
    SET email_verified = true
    WHERE id = $1;
  `;
  await client.query(updateQuery, [user_id]);

  // Mark the token as used
  const markUsedQuery = `
    UPDATE ${tokenTableName}
    SET used = true
    WHERE token_hash = $1;
  `;
  await client.query(markUsedQuery, [tokenHash]);

  // Generate account completion token with retries
  let retries = 0;
  let accountCompletionToken, accountCompletionHash, isUnique;
  const maxRetries = 5;

  do {
    if (retries >= maxRetries) {
      throw new Error(
        "Failed to generate a unique account completion token after multiple attempts.",
      );
    }

    accountCompletionToken = crypto.randomBytes(32).toString("hex");
    accountCompletionHash = crypto
      .createHash("sha256")
      .update(accountCompletionToken)
      .digest("hex");

    const tokenCheckQuery = `
      SELECT 1 FROM ${tokenTableName} WHERE token_hash = $1;
    `;
    const tokenCheckResult = await client.query(tokenCheckQuery, [
      accountCompletionHash,
    ]);

    isUnique = tokenCheckResult.rows.length === 0;
    retries++;
  } while (!isUnique);

  const accountCompletionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Insert the account completion token into the database
  await client.query(
    `
    INSERT INTO ${tokenTableName} (user_id, token_hash, token_type, expires_at, used, created_at, updated_at)
    VALUES ($1, $2, 'account_completion', $3, false, NOW(), NOW());
  `,
    [user_id, accountCompletionHash, accountCompletionExpiresAt],
  );

  // Send the welcome email with the account completion link
  const accountCompletionUrl = `${process.env.FRONTEND_DOMAIN_URL_DEV}/complete-account?token=${accountCompletionToken}`;
  await sendWelcomeEmail(email, accountCompletionUrl, configurationSet);
};
