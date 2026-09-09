import { Spinner } from "@/components/ui/spinner";

export default function LoginLoading() {
  return (
    <div className="flex w-full items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
