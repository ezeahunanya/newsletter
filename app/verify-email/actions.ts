"use server";

import { Client } from "@neondatabase/serverless";
import { generateUniqueToken } from "@/lib/generateUniqueToken";
import { sendEmail } from "@/lib/send-emails/email";
import { validateToken } from "@/lib/validateToken";
import { hashToken } from "@/lib/utils";
import { encryptToken } from "@/lib/encryption";

export async function verifyEmail(
  token: string,
): Promise<{ success: boolean; message: string }> {
  if (!token) {
    console.error("❌ Token is required but not provided.");
    return {
      success: false,
      message: "Token is required.",
    };
  }
  const tokenHash = hashToken(token);

  const client = new Client(process.env.DATABASE_URL);
  await client.connect();

  try {
    // Start transaction
    await client.query("BEGIN");
    console.log("🔄 Database transaction started.");

    const { user_id, email } = await validateToken(
      client,
      token,
      "email_verification",
      process.env.SUBSCRIBERS_TABLE_NAME,
    );
    console.log(`✅ Token validated for user ID: ${user_id}, email: ${email}`);

    // Mark email as verified
    await markEmailVerified(client, user_id);

    // Mark token as used
    await markTokenUsed(client, tokenHash);

    // Generate account completion token
    const { accountCompletionUrl, preferencesUrl } =
      await generateAndStoreTokens(client, user_id);

    sendEmail(email, "welcome", { accountCompletionUrl, preferencesUrl });

    // Commit transaction
    await client.query("COMMIT");
    console.log("✅ Verification transaction committed successfully.");

    return {
      success: true,
      message: "Email verified successfully. Please check email.",
    };
  } catch (error: unknown) {
    await client.query("ROLLBACK");
    console.error("❌ Transaction failed, rolling back changes:", error);

    if (error instanceof Error) {
      if (
        error.message.toLowerCase().includes("expired") ||
        error.message.toLowerCase().includes("not found")
      ) {
        return {
          success: false,
          message: error.message,
        };
      }

      if (error.message.toLowerCase().includes("used")) {
        return {
          success: true,
          message: "Email already verified. Please check email.",
        };
      }
    }

    return {
      success: false,
      message: "Internal Server Error",
    };
  } finally {
    await client.end();
  }
}

// Helper: Mark email as verified
const markEmailVerified = async (client: Client, userId: number) => {
  console.log("Marking email as verified...");
  await client.query(
    `UPDATE ${process.env.SUBSCRIBERS_TABLE_NAME} SET email_verified = true WHERE id = $1;`,
    [userId],
  );
  console.log("✅ Email marked as verified.");
};

// Helper: Mark token as used
const markTokenUsed = async (client: Client, tokenHash: string) => {
  console.log("Marking token as used...");
  await client.query(
    `UPDATE ${process.env.TOKEN_TABLE_NAME} SET used = true, updated_at = NOW() WHERE token_hash = $1;`,
    [tokenHash],
  );
  console.log("✅ Token marked as used.");
};

// Helper: Generate and store account completion and preferences tokens
const generateAndStoreTokens = async (client: Client, userId: number) => {
  console.log("Generating and storing tokens...");

  // Generate account completion token
  const { token: accountCompletionToken, tokenHash: accountCompletionHash } =
    await generateUniqueToken(client);
  const accountCompletionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await client.query(
    `INSERT INTO ${process.env.TOKEN_TABLE_NAME} (user_id, token_hash, token_type, expires_at, used, created_at, updated_at)
    VALUES ($1, $2, 'account_completion', $3, false, NOW(), NOW());`,
    [userId, accountCompletionHash, accountCompletionExpiresAt],
  );
  console.log("✅ Account completion token stored.");

  // Generate and encrypt preferences token
  const { token: preferencesToken, tokenHash: preferencesHash } =
    await generateUniqueToken(client);
  const encryptedPreferencesToken = await encryptToken(preferencesToken);

  await client.query(
    `INSERT INTO ${process.env.TOKEN_TABLE_NAME} (user_id, token_hash, encrypted_token, token_type, created_at, updated_at)
    VALUES ($1, $2, $3, 'preferences', NOW(), NOW());`,
    [userId, preferencesHash, encryptedPreferencesToken],
  );
  console.log("✅ Preferences token stored.");

  return {
    accountCompletionUrl: `${process.env.NEXT_PUBLIC_API_BASE_URL}/${process.env.NEXT_PUBLIC_MANAGE_PREFERENCES_PATH}?token=${accountCompletionToken}`,
    preferencesUrl: `${process.env.NEXT_PUBLIC_API_BASE_URL}/${process.env.NEXT_PUBLIC_COMPLETE_ACCOUNT_PATH}?token=${preferencesToken}`,
  };
};

export async function regenerateToken(
  token: string,
  origin: string,
): Promise<{ success: boolean; message: string }> {
  if (!token || !origin) {
    console.error("❌ Token and origin are required but not provided.");
    return {
      success: false,
      message: "Token and origin are required.",
    };
  }

  // Validate origin and map to token type
  const tokenType = getTokenType(origin);
  if (!tokenType) {
    console.error(`❌ Invalid origin specified: ${origin}`);
    return {
      success: false,
      message: "Invalid origin specified.",
    };
  }

  const client = new Client(process.env.DATABASE_URL);
  await client.connect();

  try {
    // Start transaction
    await client.query("BEGIN");
    console.log("🔄 Transaction started.");

    const { user_id, email } = await validateToken(
      client,
      token,
      tokenType,
      process.env.SUBSCRIBERS_TABLE_NAME,
      { allowExpired: true },
    );

    console.log(
      `✅ Token validation successful for user ID: ${user_id}, email: ${email}`,
    );

    console.log(`Generating new ${tokenType} token...`);
    const { token: newToken, tokenHash: newTokenHash } =
      await generateUniqueToken(client);

    await updateTokenInDatabase(client, user_id, newTokenHash, tokenType);

    const linkUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/${origin}?token=${newToken}`;

    sendEmail(email, "regenerate", { linkUrl, origin });

    // Commit transaction
    await client.query("COMMIT");
    console.log("✅ Transaction committed successfully.");

    return {
      success: false,
      message: "A new link has been sent to your email.",
    };
  } catch (error: unknown) {
    // Rollback on failure
    await client.query("ROLLBACK");
    console.error("❌ Transaction failed, rolling back changes:", error);
    return {
      success: false,
      message: "Internal Server Error",
    };
  }
}

type Origin = "verify-email" | "complete-account";
type TokenType = "email_verification" | "account_completion";

const getTokenType = (origin: string): TokenType | null => {
  const tokenTypeMap: Record<Origin, TokenType> = {
    "verify-email": "email_verification",
    "complete-account": "account_completion",
  };

  if (origin in tokenTypeMap) {
    return tokenTypeMap[origin as Origin];
  }

  return null;
};

// Update token in the database
const updateTokenInDatabase = async (
  client: Client,
  user_id: number,
  tokenHash: string,
  tokenType: string,
) => {
  console.log(`Updating token in database for user ID: ${user_id}`);
  const query = `
    UPDATE ${process.env.TOKEN_TABLE_NAME}
    SET token_hash = $1, expires_at = NOW() + interval '24 hours', 
        used = false, updated_at = NOW()
    WHERE user_id = $2 AND token_type = $3
  `;
  await client.query(query, [tokenHash, user_id, tokenType]);
  console.log("✅ Token updated successfully in database.");
};
