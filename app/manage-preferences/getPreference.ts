const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const managePreferencesPath = process.env.NEXT_PUBLIC_MANAGE_PREFERENCES_PATH;

if (!apiBaseUrl || !managePreferencesPath) {
  throw new Error(
    "API base URL or manage preferences path is not defined in environment variables.",
  );
}

const managePreferencesUrl = `${apiBaseUrl}${managePreferencesPath}`;

export async function getPreferences(token: string) {
  try {
    const response = await fetch(managePreferencesUrl, {
      method: "GET",
      headers: { "x-token": token, "Content-Type": "application/json" },
    });

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
      console.error("Error getting preferences:", error.message);
    } else {
      console.error("Unknown error getting preferences:", error);
    }
    return { error: "An error occurred while getting preferences." };
  }
}
