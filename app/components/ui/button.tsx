import Spinner from "./spinner";
import clsx from "clsx";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
  isSuccess?: boolean | null;
};

const Button: React.FC<ButtonProps> = ({
  isLoading = false,
  isSuccess = null,
  children,
  disabled = false,
  className,
  ...props
}: ButtonProps) => {
  const buttonClasses = clsx(
    "flex-none rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:focus-visible:outline-indigo-500",
    {
      "cursor-not-allowed bg-indigo-300": isLoading,
      "bg-green-600 dark:bg-green-500": isSuccess === true,
      "bg-red-600 dark:bg-red-500": isSuccess === false,
      "bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-500 dark:hover:bg-indigo-400":
        !isLoading && isSuccess === null,
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
