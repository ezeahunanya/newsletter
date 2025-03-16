import { Metadata } from "next";
import WarningAlertComponent from "../_components/ui/warningAlertComponent";
import Alert from "../_components/ui/alert";
import { verifyEmail } from "./actions";

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
  const result = await verifyEmail(token);

  if (!result.success) {
    return (
      <WarningAlertComponent
        token={token}
        error={result.message}
        origin="verify-email"
      />
    );
  }

  return <Alert type="success" message={result.message} />;
}
