import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import crypto from "crypto";
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

const defaultPreferences = {
  updates: true, // User agrees to updates by default
  promotions: true, // User opts out of promotions by default
};

// Insert email into the database
const insertEmail = async (client, tableName, email) => {
  const query = `
    INSERT INTO ${tableName} (email, subscribed, subscribed_at, email_verified, preferences)
    VALUES ($1, $2, NOW(), $3, $4) RETURNING id;
  `;
  const values = [email, true, false, JSON.stringify(defaultPreferences)];

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

// Insert token into the token table
const insertToken = async (
  client,
  tableName,
  userId,
  tokenHash,
  tokenType,
  expiresAt,
) => {
  const query = `
    INSERT INTO ${tableName} (user_id, token_hash, token_type, expires_at, used, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, NOW(), NOW());
  `;
  const values = [userId, tokenHash, tokenType, expiresAt, false];

  try {
    await client.query(query, values);
  } catch (error) {
    console.error("Error inserting token:", error);
    throw error;
  }
};

// Send opt-in email using SES
const sendOptInEmail = async (email, token) => {
  const sesClient = new SESClient({ region: process.env.AWS_REGION });

  const emailParams = {
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Body: {
        Html: {
          Data: `
            <html>
              <head>
                <title>Email Verification</title>
              </head>
              <body>
                <p>Hey,</p>
                <p>Thank you for subscribing! Please verify your email address by clicking the link below:</p>
                <p><a href="${process.env.APP_URL}/verify-email?token=${token}">Verify your email</a></p>
                <p>Please note that if you do not verify your email, you will not receive any further communications from me.</p>
                <p>Thanks,</p>
                <p>Eze</p>
              </body>
            </html>
          `,
        },
      },
      Subject: {
        Data: "Please verify your email address",
      },
    },
    Source: process.env.SES_SOURCE_EMAIL,
  };

  try {
    const command = new SendEmailCommand(emailParams);
    await sesClient.send(command);
    console.log("Verification email sent successfully");
  } catch (error) {
    console.error("Error sending verification email:", error);
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

  const {
    TABLE_NAME_DEV,
    TABLE_NAME_PROD,
    TOKEN_TABLE_DEV,
    TOKEN_TABLE_PROD,
    APP_STAGE,
  } = process.env;
  const subscriberTableName =
    APP_STAGE === "production" ? TABLE_NAME_PROD : TABLE_NAME_DEV;
  const tokenTableName =
    APP_STAGE === "production" ? TOKEN_TABLE_PROD : TOKEN_TABLE_DEV;

  let dbCredentials;
  let client;

  try {
    // Fetch credentials and connect to the database
    dbCredentials = await getDbCredentials();
    client = await connectToDatabase(dbCredentials);

    // Insert email into the database
    const userId = await insertEmail(client, subscriberTableName, email);

    // Generate and store the token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const tokenType = "email_verification";
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24-hour expiry

    await insertToken(
      client,
      tokenTableName,
      userId,
      tokenHash,
      tokenType,
      expiresAt,
    );

    // Send opt-in email with the token
    const verificationUrl = `${process.env.VERIFICATION_URL}/verify-email?token=${token}`;
    await sendOptInEmail(email, verificationUrl);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Email subscribed. Please verify your email.",
      }),
    };
  } catch (error) {
    console.error("Error processing request:", error);

    if (error.message === "Email already subscribed") {
      return {
        statusCode: 409,
        body: JSON.stringify({ error: "Email already subscribed" }),
      };
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
