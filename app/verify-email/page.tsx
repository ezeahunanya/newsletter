import { Metadata } from "next";
import WarningAlertComponent from "../components/ui/warningAlertComponent";
import { verifyToken } from "./verifyEmail";
import Alert from "../components/ui/alert";

export const metadata: Metadata = {
  title: "Verify Email",
};

interface VerifyEmailPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const { token } = await searchParams;

  if (!token) {
    return <Alert type="error" message="Invalid request: Token is missing." />;
  }

  // Simulate API call to verify token
  const result = await verifyToken(token);

  if (result.error) {
    return <WarningAlertComponent token={token} error={result.error} />;
  }

  return (
    <Alert
      type="success"
      message="Your email has been successfully verified!"
    />
  );
}
