import CompleteAccountForm from "./completeAccountForm";
import { XCircleIcon } from "@heroicons/react/24/outline";

export default async function CompleteAccountPage({ searchParams }) {
  const token = searchParams?.token;
  
  if (!token) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="shrink-0">
            <XCircleIcon aria-hidden="true" className="size-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Invalid request: Token is missing.
            </h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <CompleteAccountForm token={token} />
    </div>
  );
}
