import crypto from "crypto";

export const validateToken = async (
  client,
  tokenTableName,
  token,
  tokenType,
  subscriberTableName = null, // Optional parameter for subscriber table
) => {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  // Dynamically construct the JOIN clause if the subscriber table is provided
  const joinClause = subscriberTableName
    ? `JOIN ${subscriberTableName} s ON t.user_id = s.id`
    : "";

  // Dynamically select additional fields if the subscriber table is used
  const additionalFields = subscriberTableName ? ", s.email" : "";

  const tokenQuery = `
    SELECT t.user_id, t.used, t.expires_at${additionalFields}
    FROM ${tokenTableName} t
    ${joinClause}
    WHERE t.token_hash = $1 AND t.token_type = $2;
  `;
  const tokenResult = await client.query(tokenQuery, [tokenHash, tokenType]);

  if (tokenResult.rows.length === 0) {
    throw new Error("User not found: Invalid token.");
  }

  const { used, expires_at, ...additionalFieldsResult } = tokenResult.rows[0];

  if (used) {
    if (tokenType === "email_verification") {
      throw new Error("Email already subscribed: Token has already been used.");
    } else if (tokenType === "account_completion") {
      throw new Error("Name already saved: Token has already been used.");
    } else {
      throw new Error("Token has already been used.");
    }
  }

  if (tokenType !== "preferences") {
    if (new Date() > new Date(expires_at)) {
      throw new Error("Token has expired.");
    }
  }

  return { ...additionalFieldsResult, message: "Token is valid." };
};
