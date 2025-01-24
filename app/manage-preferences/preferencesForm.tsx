"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import Button from "../components/ui/button";
import Message from "../components/ui/message";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const managePreferencesPath = process.env.NEXT_PUBLIC_MANAGE_PREFERENCES_PATH;

if (!apiBaseUrl || !managePreferencesPath) {
  throw new Error(
    "API base URL or complete account path is not defined in environment variables.",
  );
}

const managePreferencesUrl = `${apiBaseUrl}${managePreferencesPath}`;

const PREFERENCE_DESCRIPTIONS = {
  updates: "Receive valuable insights and ideas through new YouTube videos.",
  promotions:
    "Access exclusive offers designed to bring you real value and benefit.",
  // Add more preferences and descriptions here as needed
};

interface PreferencesFormProps {
  initialPreferences: {
    promotions: boolean;
    updates: boolean;
  };
  token: string;
}

interface FormValues {
  [key: string]: boolean; // Dynamic keys for preferences
}

export default function PreferencesForm({
  initialPreferences,
  token,
}: PreferencesFormProps) {
  const { register, handleSubmit, setValue, watch } = useForm<FormValues>({
    defaultValues: initialPreferences,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const [responseMessage, setResponseMessage] = useState("");

  const currentValues = watch();

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setIsSuccess(null);
    setResponseMessage("");

    try {
      const response = await fetch(managePreferencesUrl, {
        method: "POST",
        headers: { "x-token": token, "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setResponseMessage(responseData.message);
      } else {
        setIsSuccess(false);
        setResponseMessage(responseData.error);
      }
    } catch (error) {
      console.error(error);
      setIsSuccess(false);
      setResponseMessage("An error occurred while saving preferences.");
    } finally {
      setIsLoading(false); // End loading state
      setTimeout(() => {
        setIsSuccess(null);
        setResponseMessage("");
      }, 2000);
    }
  };

  const handleUnsubscribeAll = () => {
    Object.keys(initialPreferences).forEach((key) => {
      setValue(key, false);
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setValue(name, checked);
  };

  const renderPreferences = (preferences: { [key: string]: boolean }) => {
    return Object.entries(preferences).map(([key]) => (
      <div key={key} className="flex gap-3">
        <div className="flex h-6 shrink-0 items-center">
          <div className="group grid size-4 grid-cols-1">
            <input
              id={key}
              type="checkbox"
              {...register(key)}
              onChange={handleCheckboxChange}
              checked={watch(key)}
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
                  currentValues[key] ? "opacity-100" : ""
                }`}
              />
            </svg>
          </div>
        </div>
        <div className="text-sm/6">
          <label
            htmlFor={key}
            className="font-medium text-gray-900 dark:text-white"
          >
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </label>
          <p className="text-gray-500 dark:text-gray-400">
            {
              PREFERENCE_DESCRIPTIONS[
                key as keyof typeof PREFERENCE_DESCRIPTIONS
              ]
            }
          </p>
        </div>
      </div>
    ));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto mt-8 max-w-lg">
      <fieldset>
        <legend className="sr-only">Preferences</legend>
        <h1 className="mb-4 text-base/7 font-bold text-gray-900 dark:text-white">
          Preferences
        </h1>
        <div className="space-y-6">
          {renderPreferences(initialPreferences)}{" "}
          {/* Dynamically render preferences */}
          <Button
            type="button"
            variant="secondary"
            onClick={handleUnsubscribeAll}
            disabled={Object.keys(initialPreferences).every(
              (key) => !watch(key),
            )}
          >
            Unsubscribe From All
          </Button>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          isLoading={isLoading}
          isSuccess={isSuccess}
          className="mt-12"
        >
          Save Preferences
        </Button>
        {responseMessage && (
          <Message
            type={isSuccess ? "success" : "error"}
            message={responseMessage}
          />
        )}
      </fieldset>
    </form>
  );
}
