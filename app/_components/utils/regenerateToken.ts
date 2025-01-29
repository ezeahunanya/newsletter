const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const regenerateTokenPath = process.env.NEXT_PUBLIC_REGENERATE_TOKEN_PATH;

if (!apiBaseUrl || !regenerateTokenPath) {
  throw new Error(
    "API base URL or regenerate token path is not defined in environment variables.",
  );
}

const regenerateTokenUrl = `${apiBaseUrl}${regenerateTokenPath}`;

export const regenerateToken = async (token: string, origin: string) => {
  const headers = {
    "x-token": token,
    "x-request-origin": origin,
    "Content-Type": "application/json",
  };

  const response = await fetch(regenerateTokenUrl, {
    method: "PUT",
    headers,
  });

  return response;
};
