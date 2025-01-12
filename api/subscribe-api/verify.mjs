import crypto from "crypto";

// Verify email
export const verifyEmail = async (
  client,
  tokenTableName,
  subscriberTableName,
  token,
) => {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  // Check if the token exists in the token table and is not used
  const tokenQuery = `
        SELECT user_id, expires_at, used FROM ${tokenTableName}
        WHERE token_hash = $1;
    `;
  const tokenResult = await client.query(tokenQuery, [tokenHash]);

  if (tokenResult.rows.length === 0) {
    // No token found, return "Invalid Token"
    throw new Error("Invalid token");
  }

  const { user_id, expires_at, used } = tokenResult.rows[0];

  // Check if the token is used
  if (used) {
    throw new Error("Token has already been used");
  }

  // Check if the token has expired
  const currentTime = new Date();
  if (currentTime > new Date(expires_at)) {
    throw new Error("Token has expired");
  }

  // Update email_verified in the subscriber table
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
};
