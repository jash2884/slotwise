import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Slotwise — Make time for your next step", description: "Book focused 1:1 sessions with mentors. Availability, appointments, and your next step, in one place.", icons: { icon: "/favicon.svg" } };
export default function RootLayout({ children }: Readonly<{
    children: React.ReactNode;
}>) { return <html lang="en"><body>{children}</body></html>; }
