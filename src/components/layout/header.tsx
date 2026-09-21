"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ChevronDown,
  ChevronRight,
  Heart,
  LogIn,
  Menu,
  Phone,
  Search,
  ShoppingBag,
  Truck,
  User,
} from "lucide-react";
import { LOGOS, ICONS, navigation, mobileBottomIcons } from "@/constants/storefront";
import { NavButton } from "@/components/storefront/buttons/NavButton";
import { useClickOutside } from "@/hooks/useClickOutside";

import { getInitials } from "@/lib/utils";
import { ROLES } from "@/lib/constants";
import { useCustomerWishlistCount } from "@/features/customers/hooks/use-customer-wishlist";
import { useCustomerCartCount } from "@/features/customers/hooks/use-customer-cart";
import { useMainNavigation } from "@/hooks/use-main-navigation";
import { useCustomerProfile } from "@/features/customers/hooks/use-customer-profile";
import type { CustomerCategoryDto } from "@/features/customers/types/catalog.types";
import { CategoryNavDropdown, resolveCategoryIcon } from "./CategoryNavDropdown";
import { HeaderSearchBar } from "./HeaderSearchBar";

/** Shared styling for the row-2 nav links so active/idle states stay in step. */
function navLinkClass(isActive: boolean) {
  return [
    "text-sm font-medium transition-colors cursor-pointer",
    isActive
      ? "text-secondary-500 font-semibold"
      : "text-theme-text-primary hover:text-secondary-500",
  ].join(" ");
}

/** Green-bar icon link with an optional count bubble (wishlist, cart). */
function HeaderIconLink({
  href,
  label,
  badge,
  showZero = false,
  children,
}: {
  href: string;
  label: string;
  badge?: number;
  showZero?: boolean;
  children: React.ReactNode;
}) {
  const hasBadge = typeof badge === "number" && (badge > 0 || showZero);
  const displayCount = typeof badge === "number" ? badge : 0;

  return (
    <Link
      href={href}
      aria-label={hasBadge ? `${label} (${displayCount})` : label}
      className="relative grid place-items-center w-9 h-9 -m-1.5 rounded-full text-white transition-colors hover:bg-white/15"
    >
      {children}
      {hasBadge ? (
        <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-theme-secondary text-theme-secondary-fg text-[10px] font-bold flex items-center justify-center leading-none shadow-xs">
          {displayCount > 99 ? "99+" : displayCount}
        </span>
      ) : null}
    </Link>
  );
}

/**
 * A category entry in the main nav. It only grows a chevron and a dropdown
 * when the catalog actually returns sub-categories - otherwise the chevron
 * would advertise a menu with nothing behind it, so it stays a plain link.
 */
function CategoryMenuItem({
  category,
  isActive,
}: {
  category: CustomerCategoryDto;
  isActive: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const href = `/categories/${category.id}`;
  const children = category.children ?? [];

  if (children.length === 0) {
    return (
      <Link href={href} className={navLinkClass(isActive)}>
        {category.name}
      </Link>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        href={href}
        className={`${navLinkClass(isActive)} flex items-center gap-1`}
      >
        {category.name}
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          strokeWidth={2}
        />
      </Link>

      {open && (
        <div className="absolute left-0 top-full pt-2 min-w-[200px] z-50">
          <div className="rounded-xl border border-theme-border bg-white shadow-lg py-1.5 animate-in fade-in zoom-in-95">
            {children.map((sub) => (
              <Link
                key={sub.id}
                href={`/categories/${sub.id}`}
                className="block px-4 py-2 text-sm text-theme-text-primary hover:bg-secondary-50 hover:text-secondary-600 transition-colors"
              >
                {sub.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMobileCategoriesOpen, setIsMobileCategoriesOpen] = React.useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { data: profile } = useCustomerProfile();
  const isAuthenticated = status === "authenticated" || Boolean(profile);
  // `status` is "loading" until /api/auth/session resolves on every page load.
  // Treating that as logged-out would flash the Login button at signed-in users,
  // so the account cell renders a placeholder until the session is known.
  // If that request is slow or down, fall back to the signed-out UI rather than
  // stranding the user behind a skeleton with nothing to click.
  const [authGraceExpired, setAuthGraceExpired] = React.useState(false);
  React.useEffect(() => {
    if (status !== "loading") return;
    const timer = setTimeout(() => setAuthGraceExpired(true), 1500);
    return () => clearTimeout(timer);
  }, [status]);
  const isAuthLoading = status === "loading" && !authGraceExpired && !profile;
  const userRole = (session?.user?.role || (profile as any)?.role) as string | undefined;
  const isAdminUser = userRole === ROLES.ADMIN || userRole === ROLES.STAFF;
  const accountHref = isAdminUser ? "/admin/dashboard" : "/profile";

  // Get user name and initials for authenticated header state
  const userName = profile?.name || session?.user?.name || "";
  const userInitials = React.useMemo(() => {
    if (userName && userName.trim().length > 0) {
      return getInitials(userName) || "U";
    }
    const email = session?.user?.email || profile?.email;
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return "U";
  }, [userName, session?.user?.email, profile?.email]);

  // Real-time badge counts from customer endpoints (only enabled when authenticated)
  const { data: wishlistCount = 0 } = useCustomerWishlistCount();
  const { data: cartCountData } = useCustomerCartCount();
  const cartCount =
    typeof cartCountData === "number"
      ? cartCountData
      : (cartCountData as { count?: number; totalQuantity?: number })?.totalQuantity ??
        (cartCountData as { count?: number })?.count ??
        0;

  // Categories for the drawer and the named nav entries. Shared with the
  // footer's Quick Links so the two can never disagree.
  const {
    categories,
    navCategories,
    isLoading: isCategoriesLoading,
  } = useMainNavigation();

  const menuRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLDivElement>(null);

  useClickOutside([menuRef, buttonRef], () => {
    setIsOpen(false);
    setIsMobileCategoriesOpen(false);
  });

  const resolvePath = React.useCallback(
    (item: { id: number; path?: string; alt?: string; text?: string }) => {
      const isUser =
        item.alt === "user" || item.text === "Account" || item.path === "/profile";
      const isWishlist =
        item.alt === "wishlist" || item.text === "Wishlist" || item.path === "/wishlist";
      const isCart =
        item.alt === "cart" || item.text === "Cart" || item.path === "/cart";

      if (isUser) {
        return isAuthenticated ? accountHref : "/login";
      }
      if (isWishlist) {
        return isAuthenticated ? "/wishlist" : "/login?callbackUrl=/wishlist";
      }
      if (isCart) {
        return isAuthenticated ? "/cart" : "/login?callbackUrl=/cart";
      }
      return item.path || "/";
    },
    [isAuthenticated, accountHref]
  );

  return (
    <header className="sticky top-0 z-50 w-full header-font">
      {/* ================================================================ */}
      {/* Row 1 - green utility bar: logo, search, help, account icons     */}
      {/* ================================================================ */}
      <div className="bg-theme-primary">
        <div className="max-w-[1400px] mx-auto h-16 lg:h-[68px] px-3 sm:px-4 md:px-8 flex items-center gap-3 sm:gap-5">
          {/* The logo artwork carries its own light gradient background, so it
              sits on a white card rather than flush on the green - otherwise
              its backdrop reads as a stray box against the bar. */}
          <Link
            href="/"
            className="shrink-0 rounded-xl bg-white/95 p-1 shadow-sm ring-1 ring-black/5 transition-transform duration-300 hover:scale-105 active:scale-95"
            aria-label="Home"
          >
            <Image
              src={LOGOS.logo}
              alt="Kollimalai Arasan"
              width={220}
              height={200}
              priority
              className="h-12 lg:h-[52px] w-auto rounded-lg"
            />
          </Link>

          {/* Direct Interactive Search Bar with Live Inline Dropdown */}
          <HeaderSearchBar />

          {/* Right cluster (desktop) */}
          <div className="hidden lg:flex items-center gap-5 shrink-0">
            <Link
              href="/contact"
              className="flex items-center gap-2 text-sm text-white underline underline-offset-4 decoration-1 hover:opacity-80 transition-opacity"
            >
              <Phone className="w-[18px] h-[18px]" strokeWidth={1.75} />
              <span>How Can We Help?</span>
            </Link>

            {/* Same fixed-slot trick as before: the login/avatar swap must not
                drag the wishlist and cart icons sideways once auth resolves. */}
            <div className="flex min-w-[26px] justify-end">
              {isAuthLoading ? (
                <div
                  className="w-[26px] h-[26px] rounded-full bg-white/30 animate-pulse"
                  aria-hidden="true"
                />
              ) : isAuthenticated ? (
                <Link
                  href={accountHref}
                  aria-label={
                    isAdminUser
                      ? "Admin Dashboard"
                      : userName
                      ? `${userName}'s profile`
                      : "Profile"
                  }
                  className="w-[26px] h-[26px] rounded-full bg-white text-theme-primary text-[11px] font-bold flex items-center justify-center leading-none select-none hover:scale-105 transition-transform"
                >
                  {userInitials}
                </Link>
              ) : (
                <Link
                  href="/login"
                  aria-label="Login"
                  className="text-white hover:opacity-80 transition-opacity"
                >
                  <User className="w-[21px] h-[21px]" strokeWidth={1.75} />
                </Link>
              )}
            </div>

            <HeaderIconLink
              href={isAuthenticated ? "/wishlist" : "/login?callbackUrl=/wishlist"}
              label="Wishlist"
              badge={wishlistCount}
            >
              <Heart className="w-[21px] h-[21px]" strokeWidth={1.75} />
            </HeaderIconLink>

            <HeaderIconLink
              href={isAuthenticated ? "/cart" : "/login?callbackUrl=/cart"}
              label="Cart"
              badge={cartCount}
              showZero
            >
              <ShoppingBag className="w-[21px] h-[21px]" strokeWidth={1.75} />
            </HeaderIconLink>
          </div>

          {/* Hamburger (mobile) */}
          <div ref={buttonRef} className="lg:hidden shrink-0">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Menu"
              aria-expanded={isOpen}
              className="grid place-items-center w-9 h-9 text-white cursor-pointer"
            >
              <Menu className="w-6 h-6" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* Row 2 - white nav bar (desktop only)                             */}
      {/* ================================================================ */}
      <div className="hidden lg:block bg-white shadow-xs border-b border-theme-border-subtle">
        <div className="max-w-[1400px] mx-auto h-12 px-8 flex items-center">
          <nav className="flex-1 flex items-center justify-center gap-8">
            <Link href="/" className={navLinkClass(pathname === "/")}>
              Home
            </Link>

            <CategoryNavDropdown
              text="Shop All"
              isActive={
                pathname === "/products" || pathname.startsWith("/categories")
              }
            />

            {navCategories.map((category) => (
              <CategoryMenuItem
                key={category.id}
                category={category}
                isActive={pathname === `/categories/${category.id}`}
              />
            ))}

            <Link href="/about" className={navLinkClass(pathname === "/about")}>
              About Us
            </Link>
            <Link
              href="/contact"
              className={navLinkClass(pathname === "/contact")}
            >
              Contact
            </Link>
          </nav>

          <Link
            href="/bulk-order"
            className="shrink-0 flex items-center gap-2 text-sm font-medium text-secondary-500 underline underline-offset-4 decoration-1 hover:text-secondary-600 transition-colors"
          >
            <Truck className="w-[18px] h-[18px]" strokeWidth={1.75} />
            <span>Need Delivery?</span>
          </Link>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <>
        {/* Overlay */}
        <div
          onClick={() => {
            setIsOpen(false);
            setIsMobileCategoriesOpen(false);
          }}
          className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-all duration-500 ${
            isOpen ? "opacity-100 visible" : "opacity-0 invisible"
          }`}
        />

        {/* Drawer Panel */}
        <div
          ref={menuRef}
          className={`fixed top-0 right-0 z-50 h-screen w-72 bg-[var(--secondary-500)] border-l border-white/20 shadow-2xl transform transition-all duration-500 ease-in-out flex flex-col ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/20 px-6 py-5 shrink-0">
            <h2 className="text-xl font-semibold text-white uppercase tracking-wide">
              Menu
            </h2>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsMobileCategoriesOpen(false);
              }}
              className="text-2xl text-white hover:text-gray-300 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-3 scrollbar-thin scrollbar-thumb-white/20">
            {navigation.map((item) => {
              const isSnacks =
                item.text === "Shop All" || item.path === "/products";

              if (isSnacks) {
                return (
                  <div key={item.id} className="border-b border-white/10">
                    <button
                      type="button"
                      onClick={() =>
                        setIsMobileCategoriesOpen((prev) => !prev)
                      }
                      className="flex w-full items-center justify-between px-6 py-4 text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <span className="font-medium text-sm">{item.text}</span>
                      <div className="flex items-center gap-2">
                        {categories.length > 0 && (
                          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                            {categories.length}
                          </span>
                        )}
                        <Image
                          src={item.icon || ICONS.drop_icon}
                          alt="dropdown"
                          width={14}
                          height={14}
                          className={`transition-transform duration-300 ${
                            isMobileCategoriesOpen ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {/* Expandable Category Submenu */}
                    {isMobileCategoriesOpen && (
                      <div className="bg-black/20 py-2 px-4 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                        {isCategoriesLoading ? (
                          <div className="space-y-2 py-2">
                            {[1, 2, 3].map((n) => (
                              <div
                                key={`mob-skel-${n}`}
                                className="h-8 bg-white/10 rounded-lg animate-pulse"
                              />
                            ))}
                          </div>
                        ) : categories.length > 0 ? (
                          <>
                            {categories.map((cat) => {
                              const catIcon = resolveCategoryIcon(cat);
                              const isCatActive =
                                pathname === `/categories/${cat.id}`;

                              return (
                                <button
                                  key={cat.id}
                                  type="button"
                                  onClick={() => {
                                    setIsOpen(false);
                                    setIsMobileCategoriesOpen(false);
                                    router.push(`/categories/${cat.id}`);
                                  }}
                                  className={`
                                    w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs
                                    transition-colors cursor-pointer
                                    ${
                                      isCatActive
                                        ? "bg-white/20 text-white font-bold"
                                        : "text-white/85 hover:bg-white/10 hover:text-white"
                                    }
                                  `}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center p-0.5 shrink-0">
                                      <Image
                                        src={catIcon}
                                        alt={cat.name}
                                        width={18}
                                        height={18}
                                        unoptimized
                                        className="w-4 h-4 object-contain"
                                      />
                                    </div>
                                    <span className="truncate">{cat.name}</span>
                                  </div>
                                  <ChevronRight className="w-3.5 h-3.5 text-white/50 shrink-0" />
                                </button>
                              );
                            })}

                            <Link
                              href="/categories"
                              onClick={() => {
                                setIsOpen(false);
                                setIsMobileCategoriesOpen(false);
                              }}
                              className="flex items-center justify-center gap-1.5 w-full mt-2 py-2 text-[11px] font-semibold text-white/90 bg-white/15 hover:bg-white/25 rounded-lg transition-colors"
                            >
                              <span>View All Categories</span>
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          </>
                        ) : (
                          <div className="py-2 text-center text-xs text-white/60">
                            No categories available
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <NavButton
                  key={item.id}
                  variant="drawer"
                  text={item.text}
                  icon={item.icon}
                  isActive={pathname === item.path}
                  href={item.path}
                  onClick={() => {
                    setIsOpen(false);
                    setIsMobileCategoriesOpen(false);
                  }}
                />
              );
            })}
          </nav>
        </div>
      </>

      {/* Mobile Bottom Navigation Bar */}
      <div
        className="
          fixed
          bottom-0
          left-0
          w-full
          bg-white/90
          backdrop-blur-xl
          border-t
          border-neutral-200
          shadow-[0_-8px_30px_rgba(0,0,0,0.08)]
          flex
          justify-around
          items-center
          py-2.5
          pb-[calc(env(safe-area-inset-bottom)+10px)]
          lg:hidden
          z-50
        "
      >
        {mobileBottomIcons.map((item) => {
          const isUser =
            item.text === "Account" || item.path === "/profile";
          const targetPath = resolvePath(item);
          const badge =
            item.text === "Cart"
              ? cartCount
              : item.text === "Wishlist"
              ? wishlistCount
              : undefined;

          if (isUser) {
            // "Login" and "Account" are different widths, and this bar is
            // justify-around, so the swap would nudge all four items. Same fix
            // as the desktop row: pin the cell width, let it repaint inside.
            return (
              <div key={item.id} className="flex w-16 justify-center">
                {isAuthLoading ? (
                  <div
                    className="flex flex-col-reverse items-center gap-1"
                    aria-hidden="true"
                  >
                    <span className="h-4 w-10 rounded bg-theme-surface-alt animate-pulse" />
                    <span className="h-5 w-5 rounded-full bg-theme-surface-alt animate-pulse" />
                  </div>
                ) : !isAuthenticated ? (
                  <NavButton
                    variant="bottom"
                    customIcon={
                      <LogIn
                        className="w-[18px] h-[18px] text-theme-text-primary"
                        strokeWidth={1.75}
                      />
                    }
                    text="Login"
                    href="/login"
                    onClick={() => router.push("/login")}
                    isActive={pathname === "/login"}
                  />
                ) : (
                  <NavButton
                    variant="bottom"
                    customIcon={
                      <div className="w-5 h-5 rounded-full bg-theme-primary text-theme-primary-fg text-[10px] font-bold flex items-center justify-center select-none leading-none">
                        {userInitials}
                      </div>
                    }
                    text={isAdminUser ? "Admin" : "Account"}
                    href={accountHref}
                    onClick={() => router.push(accountHref)}
                    isActive={pathname === accountHref}
                  />
                )}
              </div>
            );
          }

          if (item.text === "Search" || item.path === "/search") {
            return (
              <NavButton
                key={item.id}
                variant="bottom"
                icon={item.icon}
                text={item.text}
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  const searchInput = document.getElementById("site-search");
                  searchInput?.focus();
                }}
                isActive={false}
              />
            );
          }

          return (
            <NavButton
              key={item.id}
              variant="bottom"
              icon={item.icon}
              text={item.text}
              href={targetPath}
              badge={badge}
              isActive={pathname === targetPath}
            />
          );
        })}
      </div>

    </header>
  );
}

export default Header;

