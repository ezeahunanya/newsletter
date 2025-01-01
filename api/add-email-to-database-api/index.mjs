import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import pg from "pg";

const { Client } = pg;

// Cached database credentials
let cachedDbCredentials = null;

// Fetch and cache database credentials
const getDbCredentials = async () => {
  if (cachedDbCredentials) return cachedDbCredentials;

  const secretsClient = new SecretsManagerClient({
    region: process.env.AWS_REGION,
  });
  const command = new GetSecretValueCommand({
    SecretId: process.env.DB_SECRET_ARN,
  });

  try {
    const secret = await secretsClient.send(command);
    cachedDbCredentials = JSON.parse(secret.SecretString);
    return cachedDbCredentials;
  } catch (error) {
    console.error("Failed to retrieve credentials:", error);
    throw new Error("Failed to retrieve database credentials");
  }
};

// Establish and return a database connection
const connectToDatabase = async (dbCredentials) => {
  const { DB_HOST, DB_NAME, DB_PORT } = process.env;

  const client = new Client({
    host: DB_HOST,
    database: DB_NAME,
    port: parseInt(DB_PORT, 10),
    user: dbCredentials.username,
    password: dbCredentials.password,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    return client;
  } catch (error) {
    console.error("Database connection failed:", error);
    throw new Error("Database connection failed");
  }
};

// Validate email format
const validateEmail = (email) => {
  const emailRegex =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return emailRegex.test(email);
};

// Insert email into the database
const insertEmail = async (client, tableName, email) => {
  const query = `
    INSERT INTO ${tableName} (email, subscribed_at, email_verified, number_of_emails_sent, number_of_emails_opened)
    VALUES ($1, NOW(), $2, $3, $4) RETURNING id;
  `;
  const values = [email, false, 0, 0];

  try {
    const res = await client.query(query, values);
    return res.rows[0].id;
  } catch (error) {
    if (error.code === "23505") {
      throw new Error("Email already subscribed");
    }
    throw error;
  }
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

  const { TABLE_NAME_DEV, TABLE_NAME_PROD, APP_STAGE } = process.env;
  const tableName =
    APP_STAGE === "production" ? TABLE_NAME_PROD : TABLE_NAME_DEV;

  let dbCredentials;
  let client;

  try {
    // Fetch credentials and connect to the database
    dbCredentials = await getDbCredentials();
    client = await connectToDatabase(dbCredentials);

    // Insert email into the database
    const id = await insertEmail(client, tableName, email);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Email subscribed", id }),
    };
  } catch (error) {
    console.error("Error processing request:", error);

    if (error.message === "Email already subscribed") {
      return {
        statusCode: 409,
        body: JSON.stringify({ error: "Email already subscribed" }),
      };
    }

    if (error.message === "Database connection failed") {
      // Retry on authentication failure
      try {
        cachedDbCredentials = null; // Clear cached credentials
        dbCredentials = await getDbCredentials();
        client = await connectToDatabase(dbCredentials);

        // Retry inserting the email
        const id = await insertEmail(client, tableName, email);
        return {
          statusCode: 200,
          body: JSON.stringify({ message: "Email subscribed", id }),
        };
      } catch (retryError) {
        console.error("Retry failed:", retryError);
      }
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  } finally {
    if (client) {
      await client.end();
    }
  }
};
