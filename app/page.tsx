import SubscribeForm from "./subscribe/subscribeForm";
import { Metadata } from "next";
import {
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";

export const metadata: Metadata = {
  title: "Subscribe Email",
};

export default function Page() {
  return (
    <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2">
      <div className="max-w-xl lg:max-w-lg">
        <h2 className="max-w-xl text-balance text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl lg:col-span-7 dark:text-white">
          Subscribe to my newsletter
        </h2>
        <SubscribeForm />
      </div>
      <dl className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:pt-2">
        <div className="flex flex-col items-start">
          <div className="rounded-md bg-white/5 p-2 ring-1 ring-white/10">
            <CalendarDaysIcon
              aria-hidden="true"
              className="size-6 text-gray-700 dark:text-white"
            />
          </div>
          <dt className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
            Updates That Matter
          </dt>
          <dd className="mt-2 text-base/7 text-gray-900 dark:text-gray-400">
            I’ll share insights and ideas only when they’re genuinely worth your
            time. No spam, no filler. Just value!
          </dd>
        </div>
        <div className="flex flex-col items-start">
          <div className="rounded-md bg-white/5 p-2 ring-1 ring-white/10">
            <ChatBubbleLeftRightIcon
              aria-hidden="true"
              className="size-6 text-gray-700 dark:text-white"
            />
          </div>
          <dt className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
            Start a Conversation
          </dt>
          <dd className="mt-2 text-base/7 text-gray-900 dark:text-gray-400">
            When you subscribe, you’ll receive an email address to reach me. I’d
            love to hear from you. Let’s start a conversation!
          </dd>
        </div>
      </dl>
    </div>
  );
}
