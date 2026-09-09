"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  LogOut,
  ShoppingBag,
  Heart,
  Settings,
  ChevronDown,
} from "lucide-react";
import { getInitials } from "@/lib/utils";
import { ROLES } from "@/lib/constants";
import { Dropdown, DropdownItem } from "@/components/common/dropdown";

function UserMenu() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return (
      <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
    );
  }

  if (!session?.user) {
    return null;
  }

  const user = session.user;
  const isAdmin = user.role === ROLES.ADMIN || user.role === ROLES.STAFF;

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  };

  return (
    <Dropdown
      trigger={
        <button className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent transition-colors">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name || "User"}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
              {user.name ? getInitials(user.name) : "U"}
            </div>
          )}
          <span className="hidden md:inline max-w-[120px] truncate">
            {user.name}
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      }
    >
      <div className="px-3 py-2 border-b">
        <p className="text-sm font-medium truncate">{user.name}</p>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        <p className="text-xs text-muted-foreground mt-0.5 capitalize">
          {user.role?.toLowerCase()}
        </p>
      </div>

      {isAdmin ? (
        <DropdownItem onClick={() => router.push("/admin/dashboard")}>
          <Settings className="mr-2 h-4 w-4" />
          Admin Dashboard
        </DropdownItem>
      ) : (
        <>
          <DropdownItem onClick={() => router.push("/profile")}>
            <User className="mr-2 h-4 w-4" />
            My Profile
          </DropdownItem>
          <DropdownItem onClick={() => router.push("/orders")}>
            <ShoppingBag className="mr-2 h-4 w-4" />
            My Orders
          </DropdownItem>
          <DropdownItem onClick={() => router.push("/wishlist")}>
            <Heart className="mr-2 h-4 w-4" />
            Wishlist
          </DropdownItem>
        </>
      )}

      <div className="border-t">
        <DropdownItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownItem>
      </div>
    </Dropdown>
  );
}

export { UserMenu };
