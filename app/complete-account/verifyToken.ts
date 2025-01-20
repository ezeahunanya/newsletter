const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const completeAccountPath = process.env.NEXT_PUBLIC_COMPLETE_ACCOUNT_PATH;

if (!apiBaseUrl || !completeAccountPath) {
  throw new Error(
    "API base URL or complete account path is not defined in environment variables.",
  );
}

const completeAccountUrl = `${apiBaseUrl}${completeAccountPath}`;

export async function verifyToken(token: string) {
  try {
    const response = await fetch(
      `${completeAccountUrl}?token=${encodeURIComponent(token)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.log(errorData);
      return { error: errorData.error || "Link invalid." };
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
