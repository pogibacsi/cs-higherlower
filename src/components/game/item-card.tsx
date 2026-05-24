import { cn } from "@/lib/cn";
import type { PublicItem } from "@/components/game/types";

function formatPrice(price: number | null) {
  if (price === null) return "Hidden";
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2
  }).format(price);
}

export function ItemCard({
  item,
  label,
  state
}: {
  item: PublicItem;
  label: string;
  state?: "default" | "correct" | "wrong";
}) {
  return (
    <section
      className={cn(
        "grid min-h-[20rem] grid-rows-[auto_1fr_auto] overflow-hidden rounded-[var(--partner-radius,12px)] border bg-white/[0.06] p-4 backdrop-blur",
        state === "correct" && "border-emerald-300/70",
        state === "wrong" && "border-red-300/70",
        !state && "border-white/15"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-white/55">
          {label}
        </span>
        <span className="rounded-full border border-white/15 px-2 py-1 text-[11px] font-semibold uppercase text-white/60">
          {item.category.replace("_", " ")}
        </span>
      </div>

      <div className="flex items-center justify-center py-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.imageUrl}
          alt=""
          className="max-h-44 w-full object-contain drop-shadow-2xl"
          loading="lazy"
        />
      </div>

      <div className="space-y-3">
        <h2 className="min-h-14 text-balance text-xl font-black leading-tight text-white">
          {item.displayName}
        </h2>
        <div
          className={cn(
            "inline-flex min-h-11 items-center rounded-md bg-black/20 px-3 text-2xl font-black",
            item.priceEur === null && "price-mask w-32 text-white/35"
          )}
        >
          {item.priceEur === null ? "" : formatPrice(item.priceEur)}
        </div>
      </div>
    </section>
  );
}
