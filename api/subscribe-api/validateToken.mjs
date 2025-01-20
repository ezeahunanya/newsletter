import crypto from "crypto";

export const validateToken = async (client, tokenTableName, token) => {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const tokenQuery = `
    SELECT used, expires_at FROM ${tokenTableName}
    WHERE token_hash = $1 AND token_type = 'account_completion';
  `;
  const tokenResult = await client.query(tokenQuery, [tokenHash]);

  if (tokenResult.rows.length === 0) {
    throw new Error("Invalid token.");
  }

  const { used, expires_at } = tokenResult.rows[0];

  if (used) {
    throw new Error("Token has already been used.");
  }

  if (new Date() > new Date(expires_at)) {
    throw new Error("Token has expired.");
  }

  return { message: "Token is valid." };
};
