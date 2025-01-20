"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import Button from "../components/ui/button";
import Message from "../components/ui/message";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const completeAccountPath = process.env.NEXT_PUBLIC_COMPLETE_ACCOUNT_PATH;

if (!apiBaseUrl || !completeAccountPath) {
  throw new Error(
    "API base URL or complete account path is not defined in environment variables.",
  );
}

const completeAccountUrl = `${apiBaseUrl}${completeAccountPath}`;

interface FormData {
  firstName: string;
  lastName?: string | null;
}

interface CompleteAccountFormProps {
  token: string;
}

export default function CompleteAccountForm({
  token,
}: CompleteAccountFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>();

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const [responseMessage, setResponseMessage] = useState<string | null>(null);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setIsSuccess(null);
    setResponseMessage("");

    const processedData = {
      ...data,
      lastName: data.lastName || null, // Convert undefined to null
    };

    try {
      const response = await fetch(
        `${completeAccountUrl}?token=${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(processedData),
        },
      );

      const responseData = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setResponseMessage(responseData.message);
        reset();
      } else {
        setIsSuccess(false);
        setResponseMessage(responseData.error || "Failed to complete account.");
      }
    } catch (error) {
      console.error("Error:", error);
      setIsSuccess(false);
      setResponseMessage("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setIsSuccess(null);
        setResponseMessage("");
      }, 5000);
    }
  };

  const nameValidationPattern = /^[a-zA-ZÀ-ÖØ-öø-ÿ'’\- ]+$/;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-10">
        <h2 className="text-base/7 font-semibold text-gray-900 dark:text-white">
          Fill in your name
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <label
              htmlFor="first-name"
              className="block text-sm/6 font-medium text-gray-900 dark:text-white"
            >
              First name{" "}
              <span className="text-red-600 dark:text-red-500">*</span>
            </label>
            <div className="mt-2">
              <input
                id="first-name"
                {...register("firstName", {
                  required: "First name is required",
                  pattern: {
                    value: nameValidationPattern,
                    message:
                      "First name can only contain letters, hyphens, apostrophes, and spaces.",
                  },
                })}
                name="firstName"
                type="text"
                autoComplete="given-name"
                placeholder="First name"
                className="block w-full rounded-md bg-gray-100 px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
              />
              {errors.firstName && (
                <Message type="error" message={errors.firstName.message} />
              )}
            </div>
          </div>

          <div className="sm:col-span-3">
            <label
              htmlFor="last-name"
              className="block text-sm/6 font-medium text-gray-900 dark:text-white"
            >
              Last name
            </label>
            <div className="mt-2">
              <input
                id="last-name"
                {...register("lastName", {
                  pattern: {
                    value: nameValidationPattern,
                    message:
                      "Last name can only contain letters, hyphens, apostrophes, and spaces.",
                  },
                })}
                name="lastName"
                type="text"
                autoComplete="family-name"
                placeholder="Last name"
                className="block w-full rounded-md bg-gray-100 px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
              />
              {errors.lastName && (
                <Message type="error" message={errors.lastName.message} />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-x-6">
        <Button isLoading={isLoading} isSuccess={isSuccess} type="submit">
          Save
        </Button>
      </div>
      {responseMessage && (
        <Message
          type={isSuccess ? "success" : "error"}
          message={responseMessage}
        />
      )}
    </form>
  );
}
