"use client";

import { useState } from "react";
import Alert from "./alert";
import Button from "./button";
import Message from "./message";
import { regenerateToken } from "@/app/verify-email/actions";

interface WarningAlertComponentProps {
  token: string;
  error: string;
  origin: string;
}

export default function WarningAlertComponent({
  token,
  error,
  origin,
}: WarningAlertComponentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const [responseMessage, setResponseMessage] = useState("");

  const handleRegenerateToken = async () => {
    setIsLoading(true);
    setIsSuccess(null);
    setResponseMessage("");

    const response = await regenerateToken(token, origin);
    setIsSuccess(response.success);
    setResponseMessage(
      response.message || "A new link has been sent to your email.",
    );

    setIsLoading(false);
    setTimeout(() => {
      setIsSuccess(null);
      setResponseMessage("");
    }, 5000);
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
