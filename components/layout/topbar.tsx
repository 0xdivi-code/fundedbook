"use client";

import { usePathname, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Bell,
  ChevronDown,
  CircleUserRound,
  LogOut,
  Menu,
  Plus,
  RotateCcw,
  Search,
  Settings as SettingsIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUI } from "./ui-provider";
import { useJournal } from "@/lib/store";
import { useToast } from "@/components/ui/toast";

function titleFor(pathname: string): { title: string; sub: string } {
  if (pathname === "/")
    return { title: "Dashboard", sub: "Your trading performance at a glance" };
  if (pathname.startsWith("/trades/"))
    return { title: "Trade Review", sub: "Post-trade analysis & screenshots" };
  if (pathname.startsWith("/trades"))
    return { title: "Journal", sub: "Every trade, logged and reviewed" };
  if (pathname.startsWith("/calendar"))
    return { title: "Calendar", sub: "Performance mapped over time" };
  if (pathname.startsWith("/analytics"))
    return { title: "Analytics", sub: "Deep-dive into your edge" };
  if (pathname.startsWith("/playbook"))
    return { title: "Playbook", sub: "Your strategies & rules" };
  if (pathname.startsWith("/settings"))
    return { title: "Settings", sub: "Preferences & account" };
  return { title: "FundedBook", sub: "Trading journal" };
}

const NOTIFICATIONS = [
  {
    title: "New all-time equity high",
    detail: "Your account reached +$8,420 this week",
    time: "2h ago",
    dot: "profit",
  },
  {
    title: "Weekly review is ready",
    detail: "58 trades logged · 56.4% win rate",
    time: "Yesterday",
    dot: "primary",
  },
  {
    title: "Risk reminder",
    detail: "2 trades hit full stop-loss today. Review your playbook.",
    time: "Yesterday",
    dot: "loss",
  },
];

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { title, sub } = titleFor(pathname);
  const { openAdd, openCommand } = useUI();
  const { resetData } = useJournal();
  const { toast } = useToast();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/70 bg-background/75 px-4 backdrop-blur-xl sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex min-w-0 flex-1 flex-col leading-tight">
        <h1 className="truncate text-[17px] font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="hidden truncate text-[12px] text-muted-foreground sm:block">
          {sub} · {format(new Date(), "EEEE, MMM d")}
        </p>
      </div>

      <button
        onClick={openCommand}
        className="group hidden h-9 w-56 items-center gap-2 rounded-lg border border-border bg-card/60 px-3 text-[13px] text-muted-foreground transition-colors hover:border-white/15 hover:text-foreground md:flex cursor-pointer"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search trades…</span>
        <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </button>
      <Button
        variant="ghost"
        size="icon-sm"
        className="md:hidden"
        onClick={openCommand}
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-profit ring-2 ring-background animate-pulse-dot" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[320px]">
          <DropdownMenuLabel className="text-[13px] text-foreground">
            Notifications
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {NOTIFICATIONS.map((n) => (
            <DropdownMenuItem key={n.title} className="items-start py-2.5">
              <span
                className={
                  "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full " +
                  (n.dot === "profit"
                    ? "bg-profit"
                    : n.dot === "loss"
                      ? "bg-loss"
                      : "bg-primary")
                }
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-[13px] font-medium leading-tight">
                  {n.title}
                </span>
                <span className="text-[12px] text-muted-foreground">
                  {n.detail}
                </span>
                <span className="text-[11px] text-muted-foreground/60">
                  {n.time}
                </span>
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button onClick={() => openAdd()} className="shadow-glow">
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Add Trade</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1.5 rounded-full border border-border bg-card/60 py-1 pl-1 pr-2 transition-colors hover:border-white/15 cursor-pointer">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#38bdf8] to-[#7c6aff] text-white">
              <CircleUserRound className="h-4 w-4" />
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>
            <span className="flex flex-col">
              <span className="text-[13px] font-medium text-foreground">
                Alex Carter
              </span>
              <span className="text-[11px] font-normal text-muted-foreground">
                alex@fundedbook.io
              </span>
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => openAdd()}>
            <Plus className="h-4 w-4" />
            New trade
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/settings")}>
            <SettingsIcon className="h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              resetData();
              toast({
                variant: "info",
                title: "Demo data restored",
                description: "All trades reset to the sample dataset.",
              });
            }}
          >
            <RotateCcw className="h-4 w-4" />
            Reset demo data
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <LogOut className="h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
