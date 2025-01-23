export const handleRegenerateToken = async (
  client,
  event,
  tokenTableName,
  subscriberTableName,
) => {
  try {
    const { origin, authorization } = event.headers;

    if (!authorization) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Authorization token is required." }),
      };
    }

    if (!origin) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Origin header is required." }),
      };
    }

    const tokenType =
      origin === "complete-account"
        ? "account_completion"
        : origin === "verify-email"
          ? "email_verification"
          : null;

    if (!tokenType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid origin header value." }),
      };
    }

    // Validate the token with `allowExpired` set to true
    const { user_id, isExpired } = await validateToken(
      client,
      tokenTableName,
      authorization,
      tokenType,
      subscriberTableName,
      true, // Allow expired tokens
    );

    if (!isExpired) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Token is still valid. No need to regenerate.",
        }),
      };
    }

    // Generate a new unique token
    const { token, tokenHash } = await generateUniqueToken(
      client,
      tokenTableName,
    );

    const newExpiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Replace the old token with the new one
    const updateQuery = `
        UPDATE ${tokenTableName}
        SET
          token_hash = $1,
          expires_at = $2,
          updated_at = NOW(),
          used = FALSE
        WHERE user_id = $3 AND token_type = $4;
      `;

    await client.query(updateQuery, [
      tokenHash,
      newExpiresAt,
      user_id,
      tokenType,
    ]);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Token successfully regenerated.",
        token,
        expires_at: newExpiresAt.toISOString(),
      }),
    };
  } catch (error) {
    console.error("Error in token regeneration:", error.message);

    return {
      statusCode: error.message === "Token has expired." ? 400 : 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
