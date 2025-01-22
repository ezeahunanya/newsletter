import { Metadata } from "next";
import PreferencesForm from "./preferencesForm";
import {
  ExclamationTriangleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { getPreferences } from "./getPreference";

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

  const initialPreferences =
    typeof preferencesData.data.preferences === "string"
      ? JSON.parse(preferencesData.data.preferences)
      : preferencesData.data.preferences;

  return (
    <div>
      <PreferencesForm initialPreferences={initialPreferences} token={token} />
    </div>
  );
}
