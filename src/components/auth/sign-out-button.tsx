"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";

export function SignOutButton() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  return <button className="button button-secondary" type="button" disabled={isSigningOut} onClick={async () => {
    setIsSigningOut(true);
    await signOut();
    router.replace("/login");
    router.refresh();
  }}>{isSigningOut ? "Signing out..." : "Sign out"}</button>;
}
