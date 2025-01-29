import { Metadata } from "next";
import CompleteAccountForm from "./completeAccountForm";
import { verifyToken } from "./verifyToken";
import Alert from "../_components/ui/alert";
import WarningAlertComponent from "../_components/ui/warningAlertComponent";

export const metadata: Metadata = {
  title: "Complete Account",
};

interface CompleteAccountProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function CompleteAccountPage({
  searchParams,
}: CompleteAccountProps) {
  const { token } = await searchParams;

  if (!token)
    return <Alert type="error" message="Invalid request: Token is missing." />;

  const result = await verifyToken(token);

  if (result.error) {
    return (
      <WarningAlertComponent
        token={token}
        error={result.error}
        origin="complete-account"
      />
    );
  }

  return (
    <div>
      <CompleteAccountForm token={token} />
    </div>
  );
}
