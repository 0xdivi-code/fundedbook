import { CandlestickChart } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative flex h-8 w-8 items-center justify-center rounded-[10px] bg-[linear-gradient(135deg,#d7ff3e_0%,#6dfb78_48%,#00f5a0_100%)] shadow-[0_8px_22px_-6px_rgba(0,245,160,0.85)]">
        <CandlestickChart
          className="h-[18px] w-[18px] text-[#03140c]"
          strokeWidth={2.6}
        />
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-lemon ring-2 ring-background" />
      </div>
      <div className="flex flex-col leading-none">
        <span className="font-display text-[15px] font-bold tracking-[0.01em] text-foreground">
          Funded<span className="text-gradient">Book</span>
        </span>
        <span className="mt-1 font-mono text-[9.5px] font-medium uppercase tracking-[0.22em] text-primary/55">
          Trading Journal
        </span>
      </div>
    </div>
  );
}
