import karnatakaEmblem from "@/assets/karnataka-emblem.png";
import { cn } from "@/lib/utils";

export function KaMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-[0_0_0_1px_rgba(240,193,74,0.45)]",
        className,
      )}
    >
      <img src={karnatakaEmblem} alt="Government of Karnataka" className="h-full w-full bg-white object-contain p-[6%]" draggable={false} />
    </span>
  );
}
