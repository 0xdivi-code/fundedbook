import { CandlestickChart } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-primary via-[#8f7bff] to-[#4fd1a5] shadow-[0_8px_20px_-6px_rgba(124,106,255,0.8)]">
        <CandlestickChart className="h-[18px] w-[18px] text-white" strokeWidth={2.4} />
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-profit ring-2 ring-background" />
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-[15px] font-bold tracking-tight text-foreground">
          Funded<span className="text-gradient">Book</span>
        </span>
        <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground/70">
          Trading Journal
        </span>
      </div>
    </div>
  );
}
