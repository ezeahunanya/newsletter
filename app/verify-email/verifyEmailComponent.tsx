"use client";

import { Metadata } from "next";
import { useState } from "react";
import Alert from "../components/ui/alert";
import Button from "../components/ui/button";
import { regenerateToken } from "../components/utils/regenerateToken";
import Message from "../components/ui/message";

export const metadata: Metadata = {
  title: "Verify Email",
};

interface VerifyEmailComponentProps {
  token: string;
  error: string;
}

export default function VerifyEmailComponent({
  token,
  error,
}: VerifyEmailComponentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const [responseMessage, setResponseMessage] = useState("");

  const handleRegenerateToken = async () => {
    setIsLoading(true);
    setIsSuccess(null);
    setResponseMessage("");

    try {
      const response = await regenerateToken(token, "verify-email");
      const responseData = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setResponseMessage(
          responseData.message || "A new link has been sent to your email.",
        );
      } else {
        setIsSuccess(false);
        setResponseMessage(
          responseData.error || "Failed to regenerate the token.",
        );
      }
    } catch (error) {
      console.error("Error:", error);
      setIsSuccess(false);
      setResponseMessage("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setIsSuccess(null);
        setResponseMessage("");
      }, 5000);
    }
  };

  if (error) {
    const isExpiredError = error.toLowerCase().includes("expire");

    return (
      <div>
        <Alert type="warning" message={error} />
        {isExpiredError && (
          <div className="mt-4">
            <Button
              variant="secondary"
              isLoading={isLoading}
              isSuccess={isSuccess}
              onClick={handleRegenerateToken}
            >
              Regenerate Token
            </Button>
            <Message
              type={isSuccess ? "success" : "error"}
              message={responseMessage}
            />
          </div>
        )}
      </div>
    );
  }
}
