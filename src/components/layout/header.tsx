"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChevronRight, LogIn } from "lucide-react";
import { LOGOS, ICONS, navigation, desktopIcons, mobileBottomIcons } from "@/constants/storefront";
import { NavButton } from "@/components/storefront/buttons/NavButton";
import { IconButton } from "@/components/storefront/buttons/IconButton";
import { useClickOutside } from "@/hooks/useClickOutside";
import { getInitials } from "@/lib/utils";
import { useCustomerWishlistCount } from "@/features/customers/hooks/use-customer-wishlist";
import { useCustomerCartCount } from "@/features/customers/hooks/use-customer-cart";
import { useCustomerCategories } from "@/features/customers/hooks/use-customer-catalog";
import { useCustomerProfile } from "@/features/customers/hooks/use-customer-profile";
import { CategoryNavDropdown, resolveCategoryIcon } from "./CategoryNavDropdown";

export function Header() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMobileCategoriesOpen, setIsMobileCategoriesOpen] = React.useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
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
  const isAuthLoading = status === "loading" && !authGraceExpired;
  const { data: profile } = useCustomerProfile();

  // Get user name and initials for authenticated header state
  const userName = profile?.name || session?.user?.name || "";
  const userInitials = React.useMemo(() => {
    if (userName && userName.trim().length > 0) {
      return getInitials(userName) || "U";
    }
    if (session?.user?.email) {
      return session.user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  }, [userName, session?.user?.email]);

  // Real-time badge counts from customer endpoints (only enabled when authenticated)
  const { data: wishlistCount = 0 } = useCustomerWishlistCount();
  const { data: cartCountData } = useCustomerCartCount();
  const cartCount =
    typeof cartCountData === "number"
      ? cartCountData
      : (cartCountData as { count?: number; totalQuantity?: number })?.totalQuantity ??
        (cartCountData as { count?: number })?.count ??
        0;

  // Categories list for mobile drawer navigation
  const { data: categoriesData, isLoading: isCategoriesLoading } = useCustomerCategories({
    page: 1,
    pageSize: 50,
    sortBy: "name",
    sortOrder: "asc",
  });
  const categories = categoriesData?.data ?? [];

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
        return isAuthenticated ? "/profile" : "/login";
      }
      if (isWishlist) {
        return isAuthenticated ? "/wishlist" : "/login?callbackUrl=/wishlist";
      }
      if (isCart) {
        return isAuthenticated ? "/cart" : "/login?callbackUrl=/cart";
      }
      return item.path || "/";
    },
    [isAuthenticated]
  );

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-xs header-font">
      <div className="max-w-[1400px] mx-auto h-20 sm:h-24 px-2 sm:px-4 md:px-8 flex items-center justify-between">
        {/* Left Section (Logo + Brand Title) */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
          <Link href="/" className="inline-block">
            <Image
              src={LOGOS.logo}
              alt="logo"
              width={100}
              height={100}
              priority
              className="w-[55px] sm:w-[65px] md:w-[80px] hover:scale-105 transition-transform duration-300 active:scale-95"
            />
          </Link>

          {/* Mobile Title */}
          <Link href="/" className="block md:hidden">
            <Image
              src={LOGOS.mobileTitle}
              alt="mobile title"
              width={80}
              height={40}
              priority
              className="w-[95px] sm:w-[120px] hover:scale-105 transition-transform duration-300"
            />
          </Link>

          {/* Desktop Title */}
          <Link href="/" className="hidden md:block">
            <Image
              src={LOGOS.title}
              alt="title"
              width={80}
              height={80}
              priority
              className="hover:scale-105 transition-transform duration-300"
            />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8">
          {navigation.map((item) => {
            const isSnacks =
              item.text === "OUR SNACKS" || item.path === "/categories";

            if (isSnacks) {
              return (
                <CategoryNavDropdown
                  key={item.id}
                  text={item.text}
                  icon={item.icon}
                  isActive={
                    pathname === item.path || pathname.startsWith("/categories")
                  }
                />
              );
            }

            return (
              <NavButton
                key={item.id}
                variant="desktop"
                text={item.text}
                icon={item.icon}
                href={item.path}
                isActive={pathname === item.path}
              />
            );
          })}
        </nav>

        {/* Right Section (Icons & Hamburger) */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-5">
          <div className="hidden lg:flex items-center gap-5">
            {desktopIcons.map((item) => {
              const isUser =
                item.alt === "user" || item.path === "/profile";
              const targetPath = resolvePath(item);
              const badge =
                item.alt === "cart"
                  ? cartCount
                  : item.alt === "wishlist"
                  ? wishlistCount
                  : undefined;

              if (isUser) {
                // The account cell is the last item in a right-anchored row,
                // so the Login pill (~92px) collapsing to the 26px avatar would
                // drag every icon beside it. A fixed slot keeps the swap
                // contained: siblings never move, whichever state wins.
                return (
                  <div
                    key={item.id}
                    className="flex min-w-[92px] justify-end"
                  >
                    {isAuthLoading ? (
                      <div
                        className="w-[26px] h-[26px] rounded-full bg-theme-surface-alt animate-pulse"
                        aria-hidden="true"
                      />
                    ) : !isAuthenticated ? (
                      <Link
                        href="/login"
                        onClick={() => router.push("/login")}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm bg-theme-primary hover:bg-theme-primary-hover text-theme-primary-fg border border-theme-primary text-xs sm:text-sm font-semibold transition-all duration-150 shadow-xs hover:shadow-sm active:scale-95 cursor-pointer"
                        aria-label="Login"
                      >
                        <span>Login</span>
                        <LogIn
                          className="w-4 h-4 text-inherit shrink-0"
                          strokeWidth={2}
                        />
                      </Link>
                    ) : (
                      <IconButton
                        alt={userName ? `${userName}'s profile` : "Profile"}
                        href="/profile"
                        onClick={() => router.push("/profile")}
                        customIcon={
                          <div className="w-[26px] h-[26px] rounded-full bg-theme-primary text-theme-primary-fg text-[11px] font-bold flex items-center justify-center border border-theme-border-accent shadow-2xs select-none leading-none">
                            {userInitials}
                          </div>
                        }
                      />
                    )}
                  </div>
                );
              }

              return (
                <IconButton
                  key={item.id}
                  icon={item.icon}
                  alt={item.alt}
                  href={targetPath}
                  badge={badge}
                />
              );
            })}
          </div>

          {/* Hamburger Menu Trigger */}
          <div ref={buttonRef} className="lg:hidden">
            <IconButton
              icon={ICONS.menu}
              alt="menu"
              onClick={() => setIsOpen(!isOpen)}
              imageClassName="w-[22px] h-[22px]"
            />
          </div>
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
          className={`fixed top-0 right-0 z-50 h-screen w-72 bg-[var(--brown-600)] border-l border-white/20 shadow-2xl transform transition-all duration-500 ease-in-out flex flex-col ${
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
                item.text === "OUR SNACKS" || item.path === "/categories";

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
          border-stone-200
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
                    text="Account"
                    href="/profile"
                    onClick={() => router.push("/profile")}
                    isActive={pathname === "/profile"}
                  />
                )}
              </div>
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

