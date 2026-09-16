import * as React from "react";
import { Calendar, ShieldCheck, LucideIcon } from "lucide-react";

export interface PolicyLayoutProps {
  title: string;
  lastUpdated: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}

export function PolicyLayout({
  title,
  lastUpdated,
  icon: Icon = ShieldCheck,
  children,
}: PolicyLayoutProps) {
  return (
    <div className="w-full bg-[var(--background,#fffcf8)] py-6 sm:py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header Section */}
        <header className="mb-8 sm:mb-10 text-center sm:text-left border-b border-[var(--theme-border,#EBE0D0)] pb-6 sm:pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--theme-primary-light,#FCF7EE)] text-[var(--theme-primary,#5C1512)] text-xs font-semibold tracking-wide uppercase">
                <Icon className="h-3.5 w-3.5" />
                <span>Official Policy</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 tracking-tight font-serif">
                {title}
              </h1>
            </div>

            <div className="flex items-center justify-center sm:justify-end gap-2 text-xs sm:text-sm text-neutral-600 bg-white sm:bg-transparent px-3 py-1.5 rounded-lg border sm:border-0 border-[var(--theme-border,#EBE0D0)] shrink-0 self-center sm:self-end">
              <Calendar className="h-4 w-4 text-[var(--theme-primary,#5C1512)]" />
              <span>
                <strong>Last Updated:</strong> {lastUpdated}
              </span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <article className="rounded-2xl border border-[var(--theme-border,#EBE0D0)] bg-white p-6 sm:p-10 lg:p-12 shadow-xs text-neutral-800 leading-relaxed font-sans space-y-8">
          {children}
        </article>
      </div>
    </div>
  );
}

export default PolicyLayout;
