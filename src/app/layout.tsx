import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Bhawani Hardware",
    template: "%s · Bhawani Hardware",
  },
  description: "Shop hardware essentials and manage business operations securely.",
  applicationName: "Bhawani Hardware",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bhawani Hardware",
  },
  icons: {
    icon: "/icons/app-icon.svg",
    apple: "/icons/app-icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#173b2f",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
