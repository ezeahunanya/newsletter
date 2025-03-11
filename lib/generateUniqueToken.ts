import { Client } from "@neondatabase/serverless";
import crypto from "crypto";

/**
 * Generates a unique token and its hash, ensuring it doesn't already exist in the database.
 *
 * @param {Client} client - The database client.
 * @param {number} maxRetries - The maximum number of attempts to generate a unique token.
 * @returns {Promise<{ token: string, tokenHash: string }>} - An object containing the token and its hash.
 * @throws {Error} - If a unique token cannot be generated after the maximum retries.
 */
export const generateUniqueToken = async (
  client: Client,
  maxRetries: number = 10,
): Promise<{ token: string; tokenHash: string }> => {
  const TOKEN_TABLE = process.env.TOKEN_TABLE_NAME;

  if (!TOKEN_TABLE) {
    throw new Error("TOKEN_TABLE_NAME environment variable is not set.");
  }

  for (let retries = 0; retries < maxRetries; retries++) {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    console.log(`🔄 Attempt ${retries + 1}: Checking if token is unique...`);

    try {
      const { rowCount } = await client.query(
        `SELECT 1 FROM ${TOKEN_TABLE} WHERE token_hash = $1;`,
        [tokenHash],
      );

      if (rowCount === 0) {
        console.log(`✅ Unique token generated after ${retries + 1} attempts.`);
        return { token, tokenHash };
      }
    } catch (error) {
      console.error("❌ Error querying the database:", error);
      throw new Error("Failed to check token uniqueness.");
    }
  }

  console.error(
    `❌ Exhausted all ${maxRetries} attempts to generate a unique token.`,
  );
  throw new Error("Failed to generate a unique token after multiple attempts.");
};
