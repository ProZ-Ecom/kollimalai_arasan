import { Spinner } from "@/components/ui/spinner";

export default function AdminLoginLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Spinner size="lg" />
    </div>
  );
}
