import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ClerkProvider } from "@clerk/nextjs";
import { AuthProvider } from "@/auth/AuthContext";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "F1 Predictor — Predict Formula 1 Race Results",
    template: "%s | F1 Predictor",
  },
  description:
    "Compete with friends by predicting Formula 1 race results. Make your picks, earn points, and climb the leaderboard.",
  keywords: ["Formula 1", "F1", "predictions", "racing", "leaderboard"],
  openGraph: {
    title: "F1 Predictor",
    description:
      "Compete with friends by predicting Formula 1 race results.",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${openSans.variable} antialiased`}
      >
        <ClerkProvider>
          <AuthProvider>
            <Navbar />
            {children}
          </AuthProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
