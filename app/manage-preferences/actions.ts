"use server";

import { Client } from "@neondatabase/serverless";
import { validateToken } from "@/lib/validateToken";
import { handleError } from "@/lib/handleError";

interface preferencesType {
  [key: string]: boolean;
}

export async function getPreferences(token: string): Promise<{
  success: boolean;
  message?: string;
  preferences?: preferencesType;
}> {
  if (!token) {
    console.error("❌ Token is required but not provided.");
    return {
      success: false,
      message: "Token is required.",
    };
  }

  const client = new Client(process.env.DATABASE_URL);
  await client.connect();

  try {
    // Validate token to get user ID
    const { user_id } = await validateToken(client, token, "preferences");
    console.log(`✅ Token validation successful for user ID: ${user_id}`);

    console.log(`Fetching preferences for user ID: ${user_id}...`);
    const query = `
    SELECT preferences
    FROM ${process.env.SUBSCRIBERS_TABLE_NAME}
    WHERE id = $1;
    `;
    const result = await client.query(query, [user_id]);

    const { preferences } = result.rows[0];
    console.log(`✅ Retrieved preferences for user ID: ${user_id}.`);
    return {
      success: true,
      preferences,
    };
  } catch (error: unknown) {
    await client.query("ROLLBACK");
    console.error("❌ Transaction failed, rolling back changes:", error);

    if (error instanceof Error) {
      return await handleError(error, client);
    }

    return {
      success: false,
      message: "Internal Server Error",
    };
  } finally {
    await client.end();
  }
}

export async function updatePreferences(formData: FormData): Promise<{
  success: boolean;
  message: string;
}> {
  const data = Object.fromEntries(formData);
  const { token, preferencesString } = data as {
    token: string;
    preferencesString: string;
  };

  if (!token || !preferencesString) {
    console.error("❌ Token AND preferences are required but not provided.");
    return {
      success: false,
      message: "Both token AND preferences are required.",
    };
  }

  const preferences = JSON.parse(preferencesString) as preferencesType;

  const client = new Client(process.env.DATABASE_URL);
  await client.connect();

  try {
    // Validate token to get user ID
    const { user_id } = await validateToken(client, token, "preferences");
    console.log(`✅ Token validation successful for user ID: ${user_id}`);

    console.log(`Updating preferences for user ID: ${user_id}...`);

    const { updates, promotions } = preferences;
    if (typeof updates === "undefined" || typeof promotions === "undefined") {
      console.error("❌ Missing required preferences fields.");
      return {
        success: false,
        message:
          "Both 'updates' and 'promotions' preferences must be provided.",
      };
    }

    // Ensure preferences object is well-formed
    const updatedPreferences = {
      updates: updates ?? false,
      promotions: promotions ?? false,
    };

    // Start transaction
    await client.query("BEGIN");
    console.log("🔄 Transaction started.");

    const query =
      updatedPreferences.updates || updatedPreferences.promotions
        ? `
    UPDATE ${process.env.SUBSCRIBERS_TABLE_NAME}
    SET preferences = $1,
    status = 'subscribed',
    updated_at = NOW()
    WHERE id = $2;
    `
        : `
    UPDATE ${process.env.SUBSCRIBERS_TABLE_NAME}
    SET preferences = $1,
    status = 'unsubscribed',
    updated_at = NOW()
    WHERE id = $2;
    `;

    const params = [JSON.stringify(updatedPreferences), user_id];
    await client.query(query, params);
    console.log(`✅ Preferences updated successfully for user ID: ${user_id}.`);

    const tokenQuery = `
    UPDATE ${process.env.TOKEN_TABLE_NAME}
    SET updated_at = NOW()
    WHERE user_id = $2 AND token_type = 'preferences';
    `;

    const tokenParams = [JSON.stringify(updatedPreferences), user_id];
    await client.query(tokenQuery, tokenParams);

    // Commit transaction
    await client.query("COMMIT");
    console.log("✅ Transaction committed successfully.");

    return {
      success: true,
      message: "Preferences updated successfully",
    };
  } catch (error: unknown) {
    await client.query("ROLLBACK");
    console.error("❌ Transaction failed, rolling back changes:", error);

    if (error instanceof Error) {
      return await handleError(error, client);
    }

    return {
      success: false,
      message: "Internal Server Error",
    };
  } finally {
    await client.end();
  }
}
