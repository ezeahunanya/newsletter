import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import crypto from "crypto";
import pg from "pg";

const { Client } = pg;

// Cached instances to avoid redundant object creation
let cachedDbCredentials = null;
let secretsClient = null;
let sesClient = null;

// Fetch and cache database credentials
const getDbCredentials = async () => {
  if (cachedDbCredentials) return cachedDbCredentials;

  if (!secretsClient) {
    secretsClient = new SecretsManagerClient({
      region: process.env.AWS_REGION,
    });
  }

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

// Reuse SES client instance
const getSESClient = () => {
  if (!sesClient) {
    sesClient = new SESClient({ region: process.env.AWS_REGION });
  }
  return sesClient;
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
    INSERT INTO ${tableName} (email, subscribed, subscribed_at, email_verified, preferences)
    VALUES ($1, $2, NOW(), $3, $4) RETURNING id;
  `;
  const values = [
    email,
    true,
    false,
    JSON.stringify({ updates: true, promotions: true }),
  ];

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
const sendOptInEmail = async (email, verificationUrl, configurationSet) => {
  const sesClient = getSESClient();

  const emailParams = {
    Destination: { ToAddresses: [email] },
    Message: {
      Body: {
        Html: {
          Data: `
            <html>
              <head>
                <title>Email Verification</title>
              </head>
              <body>
                <p>Thank you for subscribing! Verify your email: <a href="${verificationUrl}">Click here</a></p>
              </body>
            </html>
          `,
        },
      },
      Subject: { Data: "Verify your email" },
    },
    Source: process.env.SES_SOURCE_EMAIL,
    ConfigurationSetName: configurationSet,
  };

  try {
    const command = new SendEmailCommand(emailParams);
    await sesClient.send(command);
    console.log("Verification email sent successfully");
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Failed to send email");
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
    WELCOME_CONFIGURATION_SET_DEV,
    WELCOME_CONFIGURATION_SET_PROD,
    APP_STAGE,
    VERIFICATION_URL,
  } = process.env;

  const isProd = APP_STAGE === "production";
  const subscriberTableName = isProd ? TABLE_NAME_PROD : TABLE_NAME_DEV;
  const tokenTableName = isProd ? TOKEN_TABLE_PROD : TOKEN_TABLE_DEV;
  const configurationSet = isProd
    ? WELCOME_CONFIGURATION_SET_PROD
    : WELCOME_CONFIGURATION_SET_DEV;

  let client;

  try {
    const dbCredentials = await getDbCredentials();
    client = await connectToDatabase(dbCredentials);

    const userId = await insertEmail(client, subscriberTableName, email);

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await insertToken(
      client,
      tokenTableName,
      userId,
      tokenHash,
      "email_verification",
      expiresAt,
    );

    const verificationUrl = `${VERIFICATION_URL}/verify-email?token=${token}`;
    await sendOptInEmail(email, verificationUrl, configurationSet);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Email subscribed. Please verify." }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: error.message === "Email already subscribed" ? 409 : 500,
      body: JSON.stringify({ error: error.message }),
    };
  } finally {
    if (client) {
      await client.end();
    }
  }
};
