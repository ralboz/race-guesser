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
  metadataBase: new URL("https://gridguesser.com"),
  title: {
    default: "Grid Guesser — F1 Prediction Game | Predict Formula 1 Race Results",
    template: "%s | Grid Guesser",
  },
  description:
    "Play Grid Guesser, the free F1 prediction game. Predict the top 10 finishing positions for every Formula 1 race, compete in private leagues with friends, and climb the season leaderboard.",
  keywords: [
    "F1 prediction game",
    "Formula 1 predictions",
    "F1 fantasy",
    "predict F1 results",
    "F1 league",
    "racing prediction game",
    "Formula 1 game",
    "F1 tips",
    "Grand Prix predictions",
    "motorsport prediction",
    "Grid Guesser",
  ],
  openGraph: {
    title: "Grid Guesser — F1 Prediction Game",
    description:
      "Predict the top 10 for every Formula 1 race, compete in leagues with friends, and prove you know F1 better than anyone.",
    url: "https://gridguesser.com",
    siteName: "Grid Guesser",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Grid Guesser — F1 Prediction Game",
    description:
      "Predict F1 race results, compete with friends, and climb the leaderboard. Free to play.",
  },
  alternates: {
    canonical: "https://gridguesser.com",
  },
  robots: {
    index: true,
    follow: true,
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
