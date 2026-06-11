import { BackButton } from "@/components/layout/back-button";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  showBackButton?: boolean;
}

export function PageHeader({ title, description, children, showBackButton = true }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {showBackButton && <BackButton />}
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
