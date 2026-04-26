import { Suspense } from "react";
import type { Metadata } from "next";
import AuthSkeleton from "@/components/AuthSkeleton";
import LazySignUp from "@/components/LazySignUp";

export const metadata: Metadata = {
  title: "Sign Up — Start Predicting F1 Results for Free",
  description:
    "Create your free Grid Guesser account and start predicting Formula 1 race results. Join leagues, compete with friends, and climb the leaderboard.",
  alternates: {
    canonical: "https://gridguesser.com/sign-up",
  },
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Suspense fallback={<AuthSkeleton />}>
        <LazySignUp />
      </Suspense>
    </div>
  );
}
