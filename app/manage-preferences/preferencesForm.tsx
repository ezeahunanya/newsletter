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

interface PreferencesFormProps {
  initialPreferences: {
    promotions: boolean;
    updates: boolean;
  };
  token: string;
}

interface FormValues {
  promotions: boolean;
  updates: boolean;
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
    setIsLoading(true); // Start loading state
    setIsSuccess(false); // Reset success state before making the request
    setResponseMessage(""); // Reset response message

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
    setValue("promotions", false);
    setValue("updates", false);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;

    setValue(name as "promotions" | "updates", checked);
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

          {/* Unsubscribe All Button */}
          <Button
            type="button"
            variant="secondary"
            onClick={handleUnsubscribeAll}
            disabled={!watch("updates") && !watch("promotions")}
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
