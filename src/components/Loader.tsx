import { cn } from "@/lib/utils";

export default function Loader({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-full h-full flex justify-center items-center",
        className,
      )}
    >
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mb-10" />
    </div>
  );
}
