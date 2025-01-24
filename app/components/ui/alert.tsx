import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from "@heroicons/react/20/solid";

const icons = {
  success: CheckCircleIcon,
  warning: ExclamationTriangleIcon,
  error: XCircleIcon,
};

type AlertProps = {
  type: "success" | "warning" | "error";
  message: string;
};

const Alert: React.FC<AlertProps> = ({ type, message }) => {
  const Icon = icons[type];

  const bgStyles = {
    success: "bg-green-50 text-green-800",
    warning: "bg-yellow-50 text-yellow-800",
    error: "bg-red-50 text-red-800",
  };

  const iconStyles = {
    success: "text-green-400",
    warning: "text-yellow-400",
    error: "text-red-400",
  };

  return (
    <div className={`rounded-md p-4 ${bgStyles[type]}`}>
      <div className="flex">
        <div className="shrink-0">
          <Icon aria-hidden="true" className={`size-5 ${iconStyles[type]}`} />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium">{message}</h3>
        </div>
      </div>
    </div>
  );
};

export default Alert;
