import { getDbCredentials, connectToDatabase } from "./db.mjs";
import { handleSubscription } from "./subscribe.mjs";
import { verifyEmail } from "./verify.mjs";

const {
  TABLE_NAME_DEV,
  TABLE_NAME_PROD,
  TOKEN_TABLE_DEV,
  TOKEN_TABLE_PROD,
  WELCOME_CONFIGURATION_SET_DEV,
  WELCOME_CONFIGURATION_SET_PROD,
  APP_STAGE,
  FRONTEND_DOMAIN_URL_DEV,
  FRONTEND_DOMAIN_URL_PROD,
} = process.env;

const isProd = APP_STAGE === "prod";
const subscriberTableName = isProd ? TABLE_NAME_PROD : TABLE_NAME_DEV;
const tokenTableName = isProd ? TOKEN_TABLE_PROD : TOKEN_TABLE_DEV;
const configurationSet = isProd
  ? WELCOME_CONFIGURATION_SET_PROD
  : WELCOME_CONFIGURATION_SET_DEV;
const frontendUrl = isProd ? FRONTEND_DOMAIN_URL_PROD : FRONTEND_DOMAIN_URL_DEV;

export const handler = async (event) => {
  const stage = event.requestContext.stage; // Get the stage ('dev', 'prod', etc.)
  const rawPath = event.rawPath; // Includes the stage prefix (e.g., /dev/subscribe)
  const normalizedPath = rawPath.replace(`/${stage}`, ""); // Strip the stage prefix

  let client;

  try {
    const dbCredentials = await getDbCredentials();
    client = await connectToDatabase(dbCredentials);

    if (normalizedPath === "/subscribe") {
      const { email } = JSON.parse(event.body);

      if (!email) {
        throw new Error("Email is required.");
      }

      const result = await handleSubscription(
        client,
        subscriberTableName,
        tokenTableName,
        email,
        frontendUrl,
        configurationSet,
      );

      return {
        statusCode: 200,
        body: JSON.stringify(result),
      };
    } else if (normalizedPath === "/verify-email") {
      const { token } = event.queryStringParameters;

      if (!token) {
        throw new Error("Token is required.");
      }

      const result = await verifyEmail(
        client,
        tokenTableName,
        subscriberTableName,
        configurationSet,
        token,
      );

      return {
        statusCode: 200,
        body: JSON.stringify(result),
      };
    } else if (normalizedPath === "/complete-account") {
      const { token } = event.queryStringParameters;
      const { firstName, lastName } = JSON.parse(event.body);

      if (!token) {
        throw new Error("Token is required.");
      }

      if (!firstName) {
        throw new Error("First name is required.");
      }

      const result = await handleAddNames(
        client,
        tokenTableName,
        subscriberTableName,
        token,
        firstName,
        lastName,
      );

      return {
        statusCode: 200,
        body: JSON.stringify(result),
      };
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ error: "Not Found" }),
    };
  } catch (error) {
    console.error(error);

    if (error.message === "This email is already subscribed.") {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "This email is already subscribed." }),
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  } finally {
    if (client) {
      await client.end();
    }
  }
};
