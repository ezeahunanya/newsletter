import { Metadata } from "next";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/20/solid";
import { verifyToken } from "./verifyEmail";

export const metadata: Metadata = {
  title: "Verify Email",
};

interface VerifyEmailProps {
  searchParams: { token?: string }; // Automatically provided by the App Router
}

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailProps) {
  const token = searchParams.token;

  if (!token) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="shrink-0">
            <XCircleIcon aria-hidden="true" className="size-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Invalid request: Token is missing.
            </h3>
          </div>
        </div>
      </div>
    );
  }

  // Simulate API call to verify token
  const result = await verifyToken(token);
  
  if (result.error) {
    return (
      <div>
        <h1>Verification Failed</h1>
        <p>{result.error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-md bg-green-50 p-4">
      <div className="flex">
        <div className="shrink-0">
          <CheckCircleIcon
            aria-hidden="true"
            className="size-5 text-green-400"
          />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-green-800">
            Your email has been successfully verified!
          </h3>
        </div>
      </div>
    </div>
  );
}
