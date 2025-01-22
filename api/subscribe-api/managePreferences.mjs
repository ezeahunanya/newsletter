import { validateToken } from "./validateToken.mjs";

export async function handleManagePreferences(
  client,
  event,
  tokenTableName,
  subscriberTableName,
) {
  const method = event.requestContext.http.method; // Check the HTTP method (GET or POST)
  const { token } = event.queryStringParameters;

  if (!token) {
    throw new Error("Token is required.");
  }

  const { user_id } = await validateToken(
    client,
    tokenTableName,
    token,
    "preferences",
  );

  if (method === "GET") {
    const query = `
      SELECT preferences
      FROM ${subscriberTableName}
      WHERE id = $1;
    `;
    const result = await client.query(query, [user_id]);

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "User not found." }),
      };
    }

    const { preferences } = result.rows[0];
    return {
      statusCode: 200,
      body: JSON.stringify({ preferences }),
    };
  } else if (method === "POST") {
    const { preferences } = JSON.parse(event.body);

    if (!preferences) {
      throw new Error("Preferences are required.");
    }

    if (!preferences.updates && !preferences.promotions) {
      // Unsubscribe from all
      const updateQuery = `
        UPDATE ${subscriberTableName}
        SET subscribed = false,
            unsubscribe_time = NOW(),
            preferences = jsonb_set(preferences, '{promotions}', 'false', true)
                          || jsonb_set(preferences, '{updates}', 'false', true)
        WHERE id = $1;
      `;
      await client.query(updateQuery, [user_id]);

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Unsubscribed from all successfully.",
        }),
      };
    } else {
      // Update specific preferences and resubscribe
      const updateQuery = `
        UPDATE ${subscriberTableName}
        SET preferences = $1,
            subscribed = true,
            unsubscribe_time = NULL
        WHERE id = $2;
      `;
      await client.query(updateQuery, [preferences, user_id]);

      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Preferences updated successfully." }),
      };
    }
  } else {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }
}
