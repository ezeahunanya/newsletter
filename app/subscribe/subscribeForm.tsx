"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

const apiUrl = process.env.NEXT_PUBLIC_API_URL as string;

if (!apiUrl) {
  throw new Error(
    "API URL is not defined. Please check your environment configuration.",
  );
}

type FormValues = {
  email: string;
};

const LoadingSpinner = () => (
  <svg
    className="h-5 w-5 animate-spin text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
    ></path>
  </svg>
);

const getButtonClasses = (isLoading: boolean, isSuccess: boolean | null) =>
  clsx(
    "flex-none rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:focus-visible:outline-indigo-500",
    {
      "cursor-not-allowed bg-indigo-300": isLoading,
      "bg-green-600 dark:bg-green-500": isSuccess === true,
      "bg-red-600 dark:bg-red-500": isSuccess === false,
      "bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-500 dark:hover:bg-indigo-400":
        !isLoading && isSuccess === null,
    },
  );

export default function SubscribeForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const [responseMessage, setResponseMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    mode: "onChange", // Validate on each change
  });

  const responseMessageStyle = useMemo(() => {
    if (errors.email) return "text-red-600 dark:text-red-500";
    if (isSuccess === true) return "text-green-600 dark:text-green-500";
    return "text-red-600 dark:text-red-500";
  }, [errors.email, isSuccess]);

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setIsSuccess(null);
    setResponseMessage("");

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: data.email }),
      });

      const responseData = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setResponseMessage(responseData.message);
      } else {
        setIsSuccess(false);
        setResponseMessage(
          responseData.error || "Failed to subscribe. Please try again.",
        );
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

  return (
    <div className="min-w-0 flex-auto text-base">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 flex max-w-md gap-x-4"
      >
        <label htmlFor="email-address" className="sr-only">
          Email address
        </label>
        <input
          id="email-address"
          {...register("email", {
            required: "Email address is required",
            pattern: {
              value:
                /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
              message: "Please enter a valid email address",
            },
          })}
          type="email"
          placeholder="Enter your email"
          autoComplete="email"
          className="min-w-0 flex-auto rounded-md bg-gray-100 px-3.5 py-2 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
        />

        <button
          type="submit"
          disabled={!isValid || isLoading}
          className={getButtonClasses(isLoading, isSuccess)}
        >
          {isLoading ? (
            <LoadingSpinner />
          ) : isSuccess === true ? (
            <CheckCircleIcon className="h-5 w-5 text-white" />
          ) : isSuccess === false ? (
            <XCircleIcon className="h-5 w-5 text-white" />
          ) : (
            "Subscribe"
          )}
        </button>
      </form>

      {(errors.email || responseMessage) && (
        <p className={`pt-2 text-sm ${responseMessageStyle}`}>
          {errors.email?.message || responseMessage}
        </p>
      )}
    </div>
  );
}
