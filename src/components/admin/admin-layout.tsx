"use client";

import { useEffect, useState } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const SIDEBAR_COLLAPSED_KEY = "admin-sidebar-collapsed";

function AdminLayout({ children }: AdminLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored === "true") setSidebarCollapsed(true);
  }, []);

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  };

  return (
    <div className="flex h-screen h-[100dvh] max-h-screen overflow-hidden w-full bg-[var(--color-background,#f8f9fa)]">
      <AdminSidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapsed}
      />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0 min-h-0 w-full">
        <AdminHeader onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="admin-canvas flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}

export { AdminLayout };
