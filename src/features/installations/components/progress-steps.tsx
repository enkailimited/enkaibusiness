import { getInstallationProgress } from "../services/installation-service";

export function ProgressSteps({ currentStatus }: { currentStatus: string }) {
  const steps = getInstallationProgress(currentStatus);

  return (
    <div className="space-y-1">
      {steps.map((step) => (
        <div key={step.label} className="flex items-center gap-3 text-sm">
          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
            step.complete ? "bg-green-500" :
            step.active ? "bg-primary ring-2 ring-primary/30" :
            "bg-gray-200"
          }`} />
          <span className={`${step.complete ? "text-green-700 font-medium" : step.active ? "text-foreground font-medium" : "text-muted-foreground"}`}>
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}
