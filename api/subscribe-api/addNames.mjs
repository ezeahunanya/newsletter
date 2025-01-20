import crypto from "crypto";

export const handleAddNames = async (
  client,
  tokenTableName,
  subscriberTableName,
  token,
  firstName,
  lastName = null,
) => {
  // Hash the token
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  // Check if the token exists and is valid
  const tokenQuery = `
    SELECT user_id, used, expires_at FROM ${tokenTableName}
    WHERE token_hash = $1 AND token_type = 'account_completion';
  `;
  const tokenResult = await client.query(tokenQuery, [tokenHash]);

  if (tokenResult.rows.length === 0) {
    throw new Error("Invalid token.");
  }

  const { user_id, used, expires_at } = tokenResult.rows[0];

  if (used) {
    throw new Error("Token has already been used.");
  }

  if (new Date() > new Date(expires_at)) {
    throw new Error("Token has expired.");
  }

  // Update the subscriber table with the provided names
  const updateQuery = `
    UPDATE ${subscriberTableName}
    SET first_name = $1, last_name = $2
    WHERE id = $3;
  `;
  await client.query(updateQuery, [firstName, lastName || null, user_id]);

  // Mark the token as used
  const markUsedQuery = `
    UPDATE ${tokenTableName}
    SET used = true
    WHERE token_hash = $1;
  `;
  await client.query(markUsedQuery, [tokenHash]);

  return { message: "Names added successfully." };
};
