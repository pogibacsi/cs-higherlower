import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Surface({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/70 bg-card/90 shadow-soft",
        className
      )}
      {...props}
    />
  );
}
