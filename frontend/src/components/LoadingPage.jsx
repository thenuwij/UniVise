import React from "react";

function LoadingPage({ message = "Loading...", progress = 0 }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-primary dark:bg-primary px-4 transition-colors duration-300">
      <div className="text-center mb-6">
        <div className="animate-pulse text-xl font-semibold text-primary dark:text-secondary">
          {message}
        </div>
      </div>
      <div className="w-full max-w-md bg-accent dark:bg-gray-700 rounded-full h-4 overflow-hidden">
        <div
          className="h-4 transition-all duration-200 bg-sky-600 dark:bg-sky-400"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default LoadingPage;
