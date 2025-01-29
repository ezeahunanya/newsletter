"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import Button from "../_components/ui/button";
import Message from "../_components/ui/message";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const subscribeEmailPath = process.env.NEXT_PUBLIC_SUBSCRIBE_EMAIL_PATH;

if (!apiBaseUrl || !subscribeEmailPath) {
  throw new Error(
    "API base URL or verify email path is not defined in environment variables.",
  );
}

const subscribeEmailUrl = `${apiBaseUrl}${subscribeEmailPath}`;

type FormValues = {
  email: string;
};

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

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setIsSuccess(null);
    setResponseMessage("");

    try {
      const response = await fetch(subscribeEmailUrl, {
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

        <Button
          isLoading={isLoading}
          isSuccess={isSuccess}
          disabled={!isValid}
          type="submit"
        >
          Subscribe
        </Button>
      </form>

      {(errors.email || responseMessage) && (
        <Message
          type={errors.email ? "error" : isSuccess ? "success" : "error"}
          message={errors.email?.message || responseMessage}
        />
      )}
    </div>
  );
}
