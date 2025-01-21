"use client";

import React, { useState } from "react";

export default function PreferencesPage() {
  const [preferences, setPreferences] = useState({
    promotions: false,
    updates: false,
    unsubscribeAll: false,
  });

  const handleCheckboxChange = (name: string, value: boolean) => {
    if (name === "unsubscribeAll" && value) {
      setPreferences({
        promotions: false,
        updates: false,
        unsubscribeAll: true,
      });
    } else if (name !== "unsubscribeAll") {
      setPreferences((prev) => ({
        ...prev,
        [name]: value,
        unsubscribeAll: false,
      }));
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch("/api/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        alert("Preferences saved successfully!");
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while saving preferences.");
    }
  };

  return (
    <fieldset className="mx-auto mt-8 max-w-xs">
      <legend className="sr-only">Preferences</legend>
      <h1 className="mb-4 text-base/7 font-bold text-gray-900 dark:text-white">
        Preferences
      </h1>
      <div className="space-y-6">
        <div className="flex gap-3">
          <div className="flex h-6 shrink-0 items-center">
            <div className="group grid size-4 grid-cols-1">
              <input
                id="updates"
                name="updates"
                type="checkbox"
                checked={preferences.updates}
                onChange={(e) =>
                  handleCheckboxChange("updates", e.target.checked)
                }
                className="col-start-1 row-start-1 appearance-none rounded border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-gray-700 dark:bg-gray-800 dark:checked:border-indigo-500 dark:checked:bg-indigo-500 dark:focus-visible:outline-indigo-500"
              />
              <svg
                fill="none"
                viewBox="0 0 14 14"
                className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white"
              >
                <path
                  d="M3 8L6 11L11 3.5"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`opacity-0 ${
                    preferences.updates ? "opacity-100" : ""
                  }`}
                />
              </svg>
            </div>
          </div>
          <div className="text-sm/6">
            <label
              htmlFor="updates"
              className="font-medium text-gray-900 dark:text-gray-300"
            >
              Receive Updates
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex h-6 shrink-0 items-center">
            <div className="group grid size-4 grid-cols-1">
              <input
                id="promotions"
                name="promotions"
                type="checkbox"
                checked={preferences.promotions}
                onChange={(e) =>
                  handleCheckboxChange("promotions", e.target.checked)
                }
                className="col-start-1 row-start-1 appearance-none rounded border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-gray-700 dark:bg-gray-800 dark:checked:border-indigo-500 dark:checked:bg-indigo-500 dark:focus-visible:outline-indigo-500"
              />
              <svg
                fill="none"
                viewBox="0 0 14 14"
                className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white"
              >
                <path
                  d="M3 8L6 11L11 3.5"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`opacity-0 ${
                    preferences.promotions ? "opacity-100" : ""
                  }`}
                />
              </svg>
            </div>
          </div>
          <div className="text-sm/6">
            <label
              htmlFor="promotions"
              className="font-medium text-gray-900 dark:text-gray-300"
            >
              Receive Promotions
            </label>
          </div>
        </div>

        <div className="flex gap-3 border-t border-gray-300 pt-6 dark:border-gray-700">
          <div className="flex h-6 shrink-0 items-center">
            <div className="group grid size-4 grid-cols-1">
              <input
                id="unsubscribeAll"
                name="unsubscribeAll"
                type="checkbox"
                checked={preferences.unsubscribeAll}
                onChange={(e) =>
                  handleCheckboxChange("unsubscribeAll", e.target.checked)
                }
                className="col-start-1 row-start-1 appearance-none rounded border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-gray-700 dark:bg-gray-800 dark:checked:border-indigo-500 dark:checked:bg-indigo-500 dark:focus-visible:outline-indigo-500"
              />
              <svg
                fill="none"
                viewBox="0 0 14 14"
                className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white"
              >
                <path
                  d="M3 8L6 11L11 3.5"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`opacity-0 ${
                    preferences.unsubscribeAll ? "opacity-100" : ""
                  }`}
                />
              </svg>
            </div>
          </div>
          <div className="text-sm/6">
            <label
              htmlFor="unsubscribeAll"
              className="font-medium text-gray-900 dark:text-gray-300"
            >
              Unsubscribe From All
            </label>
          </div>
        </div>
      </div>
      <button
        onClick={handleSave}
        className="mt-6 rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
      >
        Save Preferences
      </button>
    </fieldset>
  );
}
