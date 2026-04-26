import { Suspense } from "react";
import type { Metadata } from "next";
import AuthSkeleton from "@/components/AuthSkeleton";
import LazySignIn from "@/components/LazySignIn";

export const metadata: Metadata = {
  title: "Sign In",
  alternates: {
    canonical: "https://gridguesser.com/sign-in",
  },
};

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Suspense fallback={<AuthSkeleton />}>
        <LazySignIn />
      </Suspense>
    </div>
  );
}
