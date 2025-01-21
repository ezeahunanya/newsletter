import crypto from "crypto";
import { generateUniqueToken } from "./generateUniqueToken.mjs";
import { validateToken } from "./validateToken.mjs";
import { sendWelcomeEmail } from "./email.mjs";

export const verifyEmail = async (
  client,
  tokenTableName,
  subscriberTableName,
  configurationSet,
  token,
) => {
  const { user_id, email } = await validateToken(
    client,
    tokenTableName,
    token,
    "email_verification",
    subscriberTableName,
  );
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

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
    SET used = true, updated_at = NOW()
    WHERE token_hash = $1;
  `;
  await client.query(markUsedQuery, [tokenHash]);

  // Generate account completion token
  const { token: accountCompletionToken, tokenHash: accountCompletionHash } =
    await generateUniqueToken(client, tokenTableName);

  const accountCompletionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Insert the account completion token into the database
  await client.query(
    `
    INSERT INTO ${tokenTableName} (user_id, token_hash, token_type, expires_at, used, created_at, updated_at)
    VALUES ($1, $2, 'account_completion', $3, false, NOW(), NOW());
  `,
    [user_id, accountCompletionHash, accountCompletionExpiresAt],
  );

  // Generate preferences token
  const { token: preferencesToken, tokenHash: preferencesHash } =
    await generateUniqueToken(client, tokenTableName);

  // Insert the preferences token into the database
  await client.query(
    `
    INSERT INTO ${tokenTableName} (user_id, token_hash, token_type, created_at, updated_at)
    VALUES ($1, $2, 'preferences', NOW(), NOW());
  `,
    [user_id, preferencesHash],
  );

  // Send the welcome email with both URLs
  const accountCompletionUrl = `${process.env.FRONTEND_DOMAIN_URL_DEV}/complete-account?token=${accountCompletionToken}`;
  const preferencesUrl = `${process.env.FRONTEND_DOMAIN_URL_DEV}/manage-preferences?token=${preferencesToken}`;
  await sendWelcomeEmail(
    email,
    accountCompletionUrl,
    configurationSet,
    preferencesUrl,
  );

  return { message: "Email verified successfully." };
};
