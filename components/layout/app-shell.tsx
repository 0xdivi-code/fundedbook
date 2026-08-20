"use client";

import React from "react";
import { SidebarContent } from "./sidebar";
import { Topbar } from "./topbar";
import { CommandPalette } from "./command-palette";
import { AddTradeDrawer } from "@/components/trades/add-trade-drawer";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileNav, setMobileNav] = React.useState(false);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        // toggle the command palette via a custom event
        window.dispatchEvent(new CustomEvent("fundedbook:command"));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-border bg-[#0a0b0f] lg:block">
        <SidebarContent />
      </aside>

      <Sheet open={mobileNav} onOpenChange={setMobileNav}>
        <SheetContent side="left" className="w-[280px] p-0" hideClose>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent />
        </SheetContent>
      </Sheet>

      <div className="flex min-h-screen flex-col lg:pl-60">
        <Topbar onMenuClick={() => setMobileNav(true)} />
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>

      <AddTradeDrawer />
      <CommandPalette />
    </div>
  );
}
