import React from "react";

export default function StepIndicator({ step }) {
  return (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center">
        {[1, 2, 3].map((stepNum, index) => (
          <React.Fragment key={stepNum}>
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-xs ${
                step >= stepNum
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
              }`}
            >
              {stepNum}
            </div>
            {index < 2 && (
              <div
                className={`w-16 h-1 mx-1 ${
                  step > stepNum ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="ml-4 text-sm text-gray-600 dark:text-gray-400">
        {step === 1 && "Set your current program"}
        {step === 2 && "Choose a target program"}
        {step === 3 && "View comparison"}
      </div>
    </div>
  );
}