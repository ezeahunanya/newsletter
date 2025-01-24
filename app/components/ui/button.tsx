import Spinner from "./spinner";
import clsx from "clsx";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
  isSuccess?: boolean | null;
  variant?: "primary" | "secondary"; // Add variant prop
};

const Button: React.FC<ButtonProps> = ({
  isLoading = false,
  isSuccess = null,
  variant = "primary", // Default to "primary"
  children,
  disabled = false,
  className,
  ...props
}: ButtonProps) => {
  const buttonClasses = clsx(
    "flex-none rounded-md px-3.5 py-2.5 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:focus-visible:outline-indigo-500",
    {
      // Primary button styles
      "bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-500 dark:hover:bg-indigo-400 text-white":
        variant === "primary" && !disabled && !isLoading && isSuccess === null,
      // Secondary button styles
      "bg-white/30 dark:bg-white/10 text-gray-900 dark:text-white hover:bg-white/50 dark:hover:bg-white/20":
        variant === "secondary" &&
        !disabled &&
        !isLoading &&
        isSuccess === null,
      // Disabled styles
      "cursor-not-allowed bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400":
        disabled || isLoading,
      // Success styles
      "bg-green-600 dark:bg-green-500": isSuccess === true,
      // Error styles
      "bg-red-600 dark:bg-red-500": isSuccess === false,
    },
    className,
  );

  return (
    <button
      disabled={disabled || isLoading}
      className={buttonClasses}
      {...props}
    >
      {isLoading ? (
        <Spinner />
      ) : isSuccess === true ? (
        <CheckCircleIcon className="h-5 w-5 text-white" />
      ) : isSuccess === false ? (
        <XCircleIcon className="h-5 w-5 text-white" />
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
