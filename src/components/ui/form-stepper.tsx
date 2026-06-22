"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  title: string;
  description: string;
}

interface FormStepperProps {
  steps: Step[];
  currentStep: number;
}

export function FormStepper({ steps, currentStep }: FormStepperProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div key={index} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300",
                    isCompleted &&
                      "border-emerald-500 bg-emerald-500 text-white",
                    isCurrent &&
                      "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/25",
                    !isCompleted &&
                      !isCurrent &&
                      "border-gray-300 bg-white text-gray-400",
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="mt-2 hidden text-center sm:block">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isCurrent
                        ? "text-blue-600"
                        : isCompleted
                          ? "text-emerald-600"
                          : "text-gray-400",
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-400">{step.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-4 h-0.5 flex-1 rounded-full transition-all duration-300",
                    isCompleted ? "bg-emerald-400" : "bg-gray-200",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex gap-1 sm:hidden">
        {steps.map((step, index) => (
          <div
            key={index}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all duration-300",
              index <= currentStep ? "bg-blue-600" : "bg-gray-200",
            )}
          />
        ))}
      </div>
    </div>
  );
}
