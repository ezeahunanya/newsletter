const Message = ({ type = "error", message }) => {
  const messageStyles = {
    error: "text-red-600 dark:text-red-500",
    success: "text-green-600 dark:text-green-500",
    info: "text-blue-600 dark:text-blue-500",
  };

  if (!message) return null;

  return <p className={`pt-2 text-sm ${messageStyles[type]}`}>{message}</p>;
};

export default Message;
