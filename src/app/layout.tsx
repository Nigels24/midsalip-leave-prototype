import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { ToastProvider } from "@/components/toast";
import { ConfirmProvider } from "@/components/confirm";
import { APP } from "@/config/app";

export const metadata: Metadata = {
  title: `${APP.shortName} · ${APP.fullName}`,
  description: APP.footer,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full font-sans">
        <StoreProvider>
          <ToastProvider>
            <ConfirmProvider>{children}</ConfirmProvider>
          </ToastProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
