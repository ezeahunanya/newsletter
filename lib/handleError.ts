import { Client } from "@neondatabase/serverless";

// Utility function for handling errors
export const handleError = async (
  error: unknown,
  client: Client,
): Promise<{
  success: boolean;
  message: string;
}> => {
  console.error("❌ Error occurred:", error);

  if (client) {
    try {
      await client.query("ROLLBACK");
      console.log("🔄 Rolled back transaction.");
    } catch (rollbackError) {
      console.error("❌ Failed to rollback transaction:", rollbackError);
    }
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (
      message.includes("expired") ||
      message.includes("used") ||
      message.includes("not found")
    ) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  return {
    success: false,
    message: "Internal Server Error",
  };
};
