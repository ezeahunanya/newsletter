import { Metadata } from "next";
import PreferencesForm from "./preferencesForm";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { getPreferences } from "./getPreference";
import Alert from "../components/ui/alert";

export const metadata: Metadata = {
  title: "Manage Preferences",
};

interface PreferencesPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function PreferencesPage({
  searchParams,
}: PreferencesPageProps) {
  const { token } = await searchParams;

  if (!token) {
    return <Alert type="error" message="Invalid request: Token is missing." />;
  }

  const preferencesData = await getPreferences(token);

  if (preferencesData.error) {
    return (
      <div className="rounded-md bg-yellow-50 p-4">
        <div className="flex">
          <div className="shrink-0">
            <ExclamationTriangleIcon
              aria-hidden="true"
              className="size-5 text-yellow-400"
            />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              {preferencesData.error}
            </h3>
          </div>
        </div>
      </div>
    );
  }

  const initialPreferences = preferencesData?.data?.preferences;

  return (
    <div>
      <PreferencesForm initialPreferences={initialPreferences} token={token} />
    </div>
  );
}
