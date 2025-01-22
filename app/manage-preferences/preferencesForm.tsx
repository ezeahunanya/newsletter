"use client";

import React from "react";
import { useForm } from "react-hook-form";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const managePreferencesPath = process.env.NEXT_PUBLIC_MANAGE_PREFERENCES_PATH;

if (!apiBaseUrl || !managePreferencesPath) {
  throw new Error(
    "API base URL or complete account path is not defined in environment variables.",
  );
}

const managePreferencesUrl = `${apiBaseUrl}${managePreferencesPath}`;

interface PreferencesFormProps {
  initialPreferences: {
    promotions: boolean;
    updates: boolean;
    unsubscribeAll: boolean;
  };
  token: string;
}

interface FormValues {
  promotions: boolean;
  updates: boolean;
  unsubscribeAll: boolean;
}

export default function PreferencesForm({
  initialPreferences,
  token,
}: PreferencesFormProps) {
  // Using React Hook Form
  const { register, handleSubmit, setValue, watch } = useForm<FormValues>({
    defaultValues: initialPreferences,
  });

  // Watch current values
  const currentValues = watch();

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    try {
      const response = await fetch(
        `${managePreferencesUrl}?token=${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        },
      );

      if (response.ok) {
        alert("Preferences saved successfully!");
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while saving preferences.");
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;

    // Assert name as one of the allowed types
    const fieldName = name as "promotions" | "updates" | "unsubscribeAll";

    if (name === "unsubscribeAll") {
      if (checked) {
        console.log(currentValues);
        // Unsubscribe from all, overriding others
        setValue("promotions", false);
        setValue("updates", false);
        console.log(currentValues);
      }
      setValue(fieldName, checked);
    } else {
      if (checked) {
        // Uncheck "unsubscribeAll" if any specific preference is selected
        setValue("unsubscribeAll", false);
      }
      setValue(fieldName, checked);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto mt-8 max-w-xs">
      <fieldset>
        <legend className="sr-only">Preferences</legend>
        <h1 className="mb-4 text-base/7 font-bold text-gray-900 dark:text-white">
          Preferences
        </h1>
        <div className="space-y-6">
          {/* Updates Checkbox */}
          <div className="flex gap-3">
            <div className="flex h-6 shrink-0 items-center">
              <div className="group grid size-4 grid-cols-1">
                <input
                  id="updates"
                  type="checkbox"
                  {...register("updates")}
                  onChange={handleCheckboxChange}
                  checked={watch("updates")}
                  className="col-start-1 row-start-1 appearance-none rounded border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-gray-700 dark:bg-gray-800 dark:checked:border-indigo-500 dark:checked:bg-indigo-500 dark:focus-visible:outline-indigo-500"
                />
                <svg
                  fill="none"
                  viewBox="0 0 14 14"
                  className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white"
                >
                  <path
                    d="M3 8L6 11L11 3.5"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`opacity-0 ${
                      currentValues.updates ? "opacity-100" : ""
                    }`}
                  />
                </svg>
              </div>
            </div>
            <div className="text-sm/6">
              <label
                htmlFor="updates"
                className="font-medium text-gray-900 dark:text-gray-300"
              >
                Receive Updates
              </label>
            </div>
          </div>

          {/* Promotions Checkbox */}
          <div className="flex gap-3">
            <div className="flex h-6 shrink-0 items-center">
              <div className="group grid size-4 grid-cols-1">
                <input
                  id="promotions"
                  type="checkbox"
                  {...register("promotions")}
                  onChange={handleCheckboxChange}
                  checked={watch("promotions")}
                  className="col-start-1 row-start-1 appearance-none rounded border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-gray-700 dark:bg-gray-800 dark:checked:border-indigo-500 dark:checked:bg-indigo-500 dark:focus-visible:outline-indigo-500"
                />
                <svg
                  fill="none"
                  viewBox="0 0 14 14"
                  className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white"
                >
                  <path
                    d="M3 8L6 11L11 3.5"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`opacity-0 ${
                      currentValues.promotions ? "opacity-100" : ""
                    }`}
                  />
                </svg>
              </div>
            </div>
            <div className="text-sm/6">
              <label
                htmlFor="promotions"
                className="font-medium text-gray-900 dark:text-gray-300"
              >
                Receive Promotions
              </label>
            </div>
          </div>

          {/* Unsubscribe All Checkbox */}
          <div className="flex gap-3 border-t border-gray-300 pt-6 dark:border-gray-700">
            <div className="flex h-6 shrink-0 items-center">
              <div className="group grid size-4 grid-cols-1">
                <input
                  id="unsubscribeAll"
                  type="checkbox"
                  {...register("unsubscribeAll")}
                  onChange={handleCheckboxChange}
                  checked={watch("unsubscribeAll")}
                  className="col-start-1 row-start-1 appearance-none rounded border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-gray-700 dark:bg-gray-800 dark:checked:border-indigo-500 dark:checked:bg-indigo-500 dark:focus-visible:outline-indigo-500"
                />
                <svg
                  fill="none"
                  viewBox="0 0 14 14"
                  className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white"
                >
                  <path
                    d="M3 8L6 11L11 3.5"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`opacity-0 ${
                      currentValues.unsubscribeAll ? "opacity-100" : ""
                    }`}
                  />
                </svg>
              </div>
            </div>
            <div className="text-sm/6">
              <label
                htmlFor="unsubscribeAll"
                className="font-medium text-gray-900 dark:text-gray-300"
              >
                Unsubscribe From All
              </label>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="mt-6 rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
        >
          Save Preferences
        </button>
      </fieldset>
    </form>
  );
}
