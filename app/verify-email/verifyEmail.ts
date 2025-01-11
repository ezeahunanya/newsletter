const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const verifyEmailPath = process.env.NEXT_PUBLIC_VERIFY_EMAIL_PATH;

if (!apiBaseUrl || !verifyEmailPath) {
  throw new Error(
    "API base URL or verify email path is not defined in environment variables.",
  );
}

const verifyEmailUrl = `${apiBaseUrl}${verifyEmailPath}`;

export async function verifyToken(token: string) {
  try {
    const response = await fetch(
      `${verifyEmailUrl}?token=${encodeURIComponent(token)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.message || "Verification failed." };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    console.error("Error verifying token:", error);
    return { error: "An error occurred while verifying the token." };
  }
}
