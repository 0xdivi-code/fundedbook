import type { Metadata, Viewport } from "next";
import "./globals.css";
import { JournalProvider } from "@/lib/store";
import { ToastProvider } from "@/components/ui/toast";
import { LightboxProvider } from "@/components/trades/lightbox";
import { UIProvider } from "@/components/layout/ui-provider";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: {
    default: "FundedBook — Trading Journal",
    template: "%s · FundedBook",
  },
  description:
    "A premium trading journal to log trades, review screenshots, and understand your edge.",
};

export const viewport: Viewport = {
  themeColor: "#07080b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <JournalProvider>
          <ToastProvider>
            <LightboxProvider>
              <UIProvider>
                <AppShell>{children}</AppShell>
              </UIProvider>
            </LightboxProvider>
          </ToastProvider>
        </JournalProvider>
      </body>
    </html>
  );
}
