import { ClientSecretCredential } from "@azure/identity";

const { OUTLOOK_TENANT_ID, OUTLOOK_CLIENT_ID, OUTLOOK_CLIENT_SECRET } =
  process.env;

if (!OUTLOOK_TENANT_ID || !OUTLOOK_CLIENT_ID || !OUTLOOK_CLIENT_SECRET) {
  throw new Error(
    "Missing required environment variables: OUTLOOK_TENANT_ID, OUTLOOK_CLIENT_ID, OUTLOOK_CLIENT_SECRET",
  );
}

const credential = new ClientSecretCredential(
  OUTLOOK_TENANT_ID,
  OUTLOOK_CLIENT_ID,
  OUTLOOK_CLIENT_SECRET,
);

export const getAccessToken = async () => {
  const tokenResponse = await credential.getToken(
    "https://graph.microsoft.com/.default",
  );
  console.log("✅ Access token successfully fetched.");
  return tokenResponse.token;
};
