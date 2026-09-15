"use client";

import React from "react";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  UserRound,
  MapPin,
  Heart,
  Wallet as WalletIcon,
  Settings as SettingsIcon,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { DashboardTab } from "./DashboardTab";
import { OrdersTab } from "./OrdersTab";
import { ProfileDetailsTab } from "./ProfileDetailsTab";
import { AddressesTab } from "./AddressesTab";
import { WishlistTab } from "./WishlistTab";
import { WalletTab } from "./WalletTab";
import { SettingsTab } from "./SettingsTab";
import { useCustomerProfile } from "../../hooks/use-customer-profile";
import { useCustomerOrders } from "../../hooks/use-customer-orders";
import { useCustomerWishlist } from "../../hooks/use-customer-wishlist";

interface AccountShellProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function AccountShell({ activeTab, onTabChange }: AccountShellProps) {
  const { data: profile, isLoading: profileLoading } = useCustomerProfile();
  const {
    data: ordersResponse,
    isLoading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useCustomerOrders({ page: 1, limit: 20 });
  const { data: wishlistData } = useCustomerWishlist();

  const orders = ordersResponse?.data ?? [];
  const wishlistCount = wishlistData?.items?.length ?? wishlistData?.totalItems ?? 0;

  const userName = profile?.name || "Customer";
  const userPhone = profile?.phone || "";
  const userInitials = userName ? userName.slice(0, 2).toUpperCase() : "CU";

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "orders", label: "My Orders", icon: Package, badge: orders.length > 0 ? String(orders.length) : undefined },
    { id: "profile", label: "Profile Details", icon: UserRound },
    { id: "addresses", label: "Saved Addresses", icon: MapPin },
    { id: "wishlist", label: "Wishlist", icon: Heart, badge: wishlistCount > 0 ? String(wishlistCount) : undefined },
    { id: "wallet", label: "Wallet & Rewards", icon: WalletIcon },
    { id: "settings", label: "Settings & Password", icon: SettingsIcon },
    { id: "logout", label: "Logout", icon: LogOut },
  ];

  const tabLabels: Record<string, string> = {
    dashboard: "Dashboard",
    orders: "My Orders",
    profile: "Profile Details",
    addresses: "Saved Addresses",
    wishlist: "Wishlist",
    wallet: "Wallet & Rewards",
    settings: "Settings",
  };

  const handleNavClick = (id: string) => {
    if (id === "logout") {
      signOut({ callbackUrl: "/login" });
      return;
    }
    onTabChange(id);
  };

  return (
    <div className="min-h-screen bg-theme-bg pb-16">
      {/* Top Banner with Breadcrumb */}
      <div className="relative overflow-hidden bg-gradient-to-r from-theme-primary via-theme-primary to-theme-primary-hover py-6 sm:py-8 px-4 sm:px-8 shadow-sm">
        <div className="pointer-events-none absolute -top-12 -right-12 w-56 h-56 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 w-40 h-40 rounded-full bg-white/5" />
        <div className="relative max-w-[1440px] mx-auto flex flex-col gap-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold uppercase tracking-wider text-white">
            My Account
          </h1>
          <div className="flex items-center gap-1.5 text-xs text-theme-text-gold font-normal">
            <span>Home</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-70" />
            <span>Account</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-70" />
            <span className="text-white font-medium">{tabLabels[activeTab] || "Dashboard"}</span>
          </div>
        </div>
      </div>

      {/* Main Layout Shell */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 py-5 sm:py-7 flex flex-col md:grid md:grid-cols-[260px_1fr] lg:grid-cols-[280px_1fr] gap-5 lg:gap-7 items-start">
        {/* Mobile User Summary Card */}
        <div className="md:hidden w-full bg-theme-surface border border-theme-border rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          {profileLoading ? (
            <>
              <div className="w-11 h-11 rounded-full bg-theme-border animate-pulse flex-shrink-0" />
              <div className="min-w-0 space-y-1.5 flex-1">
                <div className="h-4 w-28 bg-theme-border rounded animate-pulse" />
                <div className="h-3 w-20 bg-theme-border-subtle rounded animate-pulse" />
              </div>
            </>
          ) : (
            <>
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-theme-primary to-theme-primary-hover ring-2 ring-white shadow-sm flex items-center justify-center font-bold text-sm text-theme-secondary-light flex-shrink-0">
                {userInitials}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm text-theme-text-primary truncate">
                  {userName}
                </div>
                {userPhone && (
                  <div className="text-xs text-theme-text-muted mt-0.5">
                    {userPhone} · Member
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Mobile Horizontal Swipeable Pill Navigation */}
        <div className="md:hidden w-full flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`flex-shrink-0 rounded-full px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-all min-h-[44px] cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? "bg-theme-primary text-theme-primary-fg border border-theme-primary shadow-sm"
                    : "bg-theme-surface text-theme-text-subtle border border-theme-border hover:bg-theme-surface-alt"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isActive ? "bg-theme-secondary text-theme-secondary-fg" : "bg-theme-border text-theme-text-muted"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Desktop Sticky Sidebar */}
        <aside className="hidden md:flex flex-col w-full bg-theme-surface border border-theme-border rounded-2xl overflow-hidden sticky top-24 shadow-sm">
          {/* User Card in Sidebar */}
          <div className="p-5 bg-gradient-to-br from-theme-primary/5 via-[#FFFBEF] to-theme-surface border-b border-theme-border-subtle flex items-center gap-3.5">
            {profileLoading ? (
              <>
                <div className="w-13 h-13 rounded-full bg-theme-border animate-pulse flex-shrink-0" />
                <div className="min-w-0 space-y-2 flex-1">
                  <div className="h-4 w-32 bg-theme-border rounded animate-pulse" />
                  <div className="h-3 w-20 bg-theme-border-subtle rounded animate-pulse" />
                </div>
              </>
            ) : (
              <>
                <div className="w-13 h-13 rounded-full bg-gradient-to-br from-theme-primary to-theme-primary-hover ring-2 ring-white ring-offset-2 ring-offset-transparent shadow-sm flex items-center justify-center font-bold text-base text-theme-secondary-light flex-shrink-0">
                  {userInitials}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-theme-text-primary truncate">
                    {userName}
                  </div>
                  {userPhone ? (
                    <div className="text-xs text-theme-text-muted mt-0.5 truncate">
                      {userPhone}
                    </div>
                  ) : (
                    <div className="text-xs text-theme-text-muted mt-0.5">
                      Member
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Desktop Nav Items */}
          <nav className="flex flex-col p-2.5 gap-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const isLogout = item.id === "logout";
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-3 w-full text-left rounded-xl px-3.5 py-3 transition-all cursor-pointer min-h-[44px] ${
                    isActive
                      ? "bg-theme-primary text-theme-primary-fg font-semibold shadow-sm"
                      : isLogout
                      ? "text-theme-status-can-fg hover:bg-theme-status-can-bg font-medium"
                      : "text-theme-text-subtle hover:bg-theme-surface-alt hover:translate-x-0.5 font-medium"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 transition-colors ${
                      isActive ? "text-theme-secondary" : isLogout ? "text-theme-status-can-fg" : "text-theme-text-muted"
                    }`}
                  />
                  <span className="flex-1 text-xs sm:text-sm">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        isActive
                          ? "bg-theme-secondary text-theme-secondary-fg"
                          : "bg-theme-primary/10 text-theme-primary"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="w-full min-w-0">
          {activeTab === "dashboard" && (
            <DashboardTab
              profile={profile}
              orders={orders}
              wishlistCount={wishlistCount}
              isLoading={profileLoading || ordersLoading}
              onNavigateTab={onTabChange}
            />
          )}

          {activeTab === "orders" && (
            <OrdersTab
              orders={orders}
              isLoading={ordersLoading}
              error={ordersError}
              onRefetch={refetchOrders}
            />
          )}

          {activeTab === "profile" && (
            <ProfileDetailsTab
              profile={profile}
              isLoading={profileLoading}
            />
          )}

          {activeTab === "addresses" && <AddressesTab />}

          {activeTab === "wishlist" && <WishlistTab />}

          {activeTab === "wallet" && (
            <WalletTab
              profile={profile}
              orders={orders}
              isLoading={profileLoading || ordersLoading}
            />
          )}

          {activeTab === "settings" && <SettingsTab />}
        </main>
      </div>
    </div>
  );
}
