import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  /** Full-width container without max-width constraint */
  fullWidth?: boolean;
  /** Additional padding */
  noPadding?: boolean;
}

function PageContainer({
  children,
  className,
  fullWidth = false,
  noPadding = false,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full",
        !fullWidth && "max-w-7xl",
        !noPadding && "px-4 sm:px-6 lg:px-8",
        "py-6",
        className
      )}
    >
      {children}
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

function SectionHeader({
  title,
  description,
  action,
  icon,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex items-start gap-3">
        {icon && (
          <div className="mt-0.5 text-primary">{icon}</div>
        )}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export { PageContainer, SectionHeader };
export type { PageContainerProps, SectionHeaderProps };
