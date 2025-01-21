import crypto from "crypto";
import { validateToken } from "./validateToken.mjs";

export const handleAddNames = async (
  client,
  tokenTableName,
  subscriberTableName,
  token,
  firstName,
  lastName = null,
) => {
  const { user_id } = await validateToken(
    client,
    tokenTableName,
    token,
    "account_completion",
  );
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const updateQuery = `
    UPDATE ${subscriberTableName}
    SET first_name = $1, last_name = $2
    WHERE id = $3;
  `;
  await client.query(updateQuery, [firstName, lastName || null, user_id]);

  const markUsedQuery = `
    UPDATE ${tokenTableName}
    SET used = true, updated_at = NOW()
    WHERE token_hash = $1;
  `;
  await client.query(markUsedQuery, [tokenHash]);

  return { message: "Names successfully added." };
};
