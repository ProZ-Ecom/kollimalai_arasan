"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LoginRequiredProps {
  action?: string;
  className?: string;
}

function LoginRequired({ action = "perform this action", className }: LoginRequiredProps) {
  const { data: session } = useSession();
  const router = useRouter();

  if (session?.user) {
    return null;
  }

  return (
    <div className={className}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          router.push("/login");
        }}
      >
        <LogIn className="mr-2 h-4 w-4" />
        Sign in to {action}
      </Button>
    </div>
  );
}

export { LoginRequired };
