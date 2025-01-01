import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import pg from "pg";

const { Client } = pg;

let cachedDbCredentials = null;

const getDbCredentials = async () => {
  // If credentials are cached, return them
  if (cachedDbCredentials) return cachedDbCredentials;

  // Otherwise, fetch from Secrets Manager
  const secretsClient = new SecretsManagerClient({
    region: process.env.AWS_REGION,
  });
  const command = new GetSecretValueCommand({
    SecretId: process.env.DB_SECRET_ARN,
  });
  const secret = await secretsClient.send(command);
  cachedDbCredentials = JSON.parse(secret.SecretString);

  return cachedDbCredentials;
};

export const handler = async (event) => {
  const body = JSON.parse(event.body);
  const { email } = body;

  if (!email) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Email is required" }),
    };
  }

  if (!validateEmail(email)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid email format" }),
    };
  }

  const {
    DB_HOST,
    DB_NAME,
    TABLE_NAME_DEV,
    TABLE_NAME_PROD,
    DB_PORT,
    APP_STAGE,
  } = process.env;

  // Determine the correct table name based on the environment
  const tableName =
    APP_STAGE === "production" ? TABLE_NAME_PROD : TABLE_NAME_DEV;

  // Fetch database credentials (cached or fresh)
  let dbCredentials;
  try {
    dbCredentials = await getDbCredentials();
  } catch (error) {
    console.error("Error retrieving credentials:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to retrieve database credentials",
      }),
    };
  }

  const { username, password } = dbCredentials;

  const client = new Client({
    host: DB_HOST,
    database: DB_NAME,
    port: parseInt(DB_PORT, 10),
    user: username,
    password: password,
    ssl: {
      rejectUnauthorized: false, // Use this for RDS
    },
  });

  try {
    // Attempt to connect to the database
    await client.connect();

    const query = `
      INSERT INTO ${tableName} (email, subscribed_at, email_verified, number_of_emails_sent, number_of_emails_opened)
      VALUES ($1, NOW(), $2, $3, $4) RETURNING id;
    `;
    const values = [email, false, 0, 0];

    const res = await client.query(query, values);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Email subscribed",
        id: res.rows[0].id,
      }),
    };
  } catch (error) {
    if (error.code === "23505") {
      return {
        statusCode: 409,
        body: JSON.stringify({ error: "Email already subscribed" }),
      };
    }

    if (error.code === "28P01") {
      // This is the error code for authentication failure
      console.error("Authentication failed, refreshing credentials", error);

      // Invalidate cached credentials and retry
      cachedDbCredentials = null; // Invalidate cache
      try {
        dbCredentials = await getDbCredentials(); // Fetch new credentials
        await client.connect(); // Retry the connection

        const query = `
          INSERT INTO subscribers (email, subscribed_at, email_verified, number_of_emails_sent, number_of_emails_opened)
          VALUES ($1, NOW(), $2, $3, $4) RETURNING id;
        `;
        const values = [email, false, 0, 0];

        const res = await client.query(query, values);

        return {
          statusCode: 200,
          body: JSON.stringify({
            message: "Email subscribed",
            id: res.rows[0].id,
          }),
        };
      } catch (refreshError) {
        console.error(
          "Failed to reconnect with new credentials:",
          refreshError,
        );
        return {
          statusCode: 500,
          body: JSON.stringify({
            error: "Failed to authenticate with new credentials",
          }),
        };
      }
    }

    console.error("Database error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  } finally {
    await client.end();
  }
};

// Email validation helper function
function validateEmail(email) {
  const emailRegex =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return emailRegex.test(email);
}
