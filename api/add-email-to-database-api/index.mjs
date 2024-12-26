import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import pg from "pg";

const { Client } = pg;

const handler = async (event) => {
  // Parse the body of the request
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
  const { DB_SECRET_ARN } = process.env;

  let dbCredentials;

  try {
    // Fetch database credentials from AWS Secrets Manager
    const secretsClient = new SecretsManagerClient({
      region: process.env.AWS_REGIO,
    });
    const command = new GetSecretValueCommand({ SecretId: DB_SECRET_ARN });
    const secret = await secretsClient.send(command);

    dbCredentials = JSON.parse(secret.SecretString);
  } catch (error) {
    console.error("Error retrieving secrets:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to retrieve database credentials",
      }),
    };
  }

  const { username, password } = dbCredentials;

  const { DB_HOST, DB_NAME, DB_PORT } = process.env;

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
    // Connect to the database
    await client.connect();

    const query = `
      INSERT INTO subscribers (email, subscribed_at, email_verified, number_of_emails_sent, number_of_emails_opened)
      VALUES ($1, NOW(), $2, $3, $4) RETURNING id;
    `;
    const values = [email, false, 0, 0];

    const res = await client.query(query, values);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Successfully subscribed",
        id: res.rows[0].id,
      }),
    };
  } catch (error) {
    if (error.code === "23505") {
      // Duplicate entry error
      return {
        statusCode: 409,
        body: JSON.stringify({ error: "Email already subscribed" }),
      };
    }

    console.error("Error occurred:", error);
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

// Export the handler using ES module syntax
export default handler;
