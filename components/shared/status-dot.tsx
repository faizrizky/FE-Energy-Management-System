import { cn } from "@/lib/utils";

export function StatusDot({
  label,
  tone = "success",
}: {
  label: string | number;
  tone?: "success" | "error";
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "size-2 rounded-sm",
          tone === "success"
            ? "bg-green-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
            : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
        )}
      />
      <span className={cn("text-xs", tone === "success" ? "text-green-500" : "text-red-500")}>
        {label}
      </span>
    </div>
  );
}
