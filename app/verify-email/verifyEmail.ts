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
    const response = await fetch(verifyEmailUrl, {
      method: "GET",
      headers: {
        "x-token": token,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.error || "Verification failed." };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: unknown) {
    // Check if the error is an instance of Error
    if (error instanceof Error) {
      console.error("Error verifying token:", error.message);
    } else {
      console.error("Unknown error verifying token:", error);
    }
    return { error: "An error occurred while verifying the token." };
  }
}
