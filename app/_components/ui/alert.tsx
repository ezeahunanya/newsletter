import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/20/solid";
import Spinner from "./spinner";

type AlertProps = {
  type: "success" | "warning" | "error" | "info";
  message?: string;
  isLoading?: boolean; // New isLoading state
};

const Alert: React.FC<AlertProps> = ({ type, message, isLoading = false }) => {
  const icons = {
    success: CheckCircleIcon,
    warning: ExclamationTriangleIcon,
    error: XCircleIcon,
    info: InformationCircleIcon,
  };

  const bgStyles = {
    success: "bg-green-50 text-green-700",
    warning: "bg-yellow-50 text-yellow-700",
    error: "bg-red-50 text-red-700",
    info: "bg-blue-100 text-blue-700",
  };

  const iconStyles = {
    success: "text-green-400",
    warning: "text-yellow-400",
    error: "text-red-400",
    info: "text-blue-400",
  };

  const Icon = icons[type];

  return (
    <div className={`rounded-md p-4 ${bgStyles[type]}`}>
      <div className="flex">
        <div className="shrink-0">
          <Icon aria-hidden="true" className={`size-5 ${iconStyles[type]}`} />
        </div>
        <div className="ml-3 flex gap-3">
          {isLoading && <Spinner />}
          <h3 className="text-sm font-medium">{message}</h3>
        </div>
      </div>
    </div>
  );
};

export default Alert;
