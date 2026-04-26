import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
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
      <head>
        <link rel="preconnect" href="https://clerk.gridguesser.com" />
        <link rel="dns-prefetch" href="https://clerk.gridguesser.com" />
        <link rel="preconnect" href="https://img.clerk.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://img.clerk.com" />
      </head>
      <body
        className={`${openSans.variable} antialiased`}
      >
        <ClerkProvider
          appearance={{
            baseTheme: dark,
            variables: {
              colorPrimary: '#e10600',
              colorBackground: '#252525',
              colorInputBackground: '#181818',
              colorText: '#f5f5f5',
              colorTextSecondary: '#a0a0a0',
              colorDanger: '#ef4444',
              borderRadius: '0.75rem',
            },
            elements: {
              card: {
                backgroundColor: '#252525',
                border: '1px solid #2d2d2d',
              },
              formButtonPrimary: {
                backgroundColor: '#e10600',
                color: '#ffffff',
              },
              'formButtonPrimary:hover': {
                backgroundColor: '#ff1e18',
              },
              footerActionLink: {
                color: '#e10600',
              },
            },
          }}
        >
          <AuthProvider>
            <Navbar />
            {children}
          </AuthProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
