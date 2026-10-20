"use client";

import { SignUp } from "@clerk/nextjs";
import { clerkBrowserEnabled } from "@/lib/clerk-browser";

export default function SignUpPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-[#050505] w-full relative z-50">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/20 via-[#050505] to-[#050505] z-0" />
      <div className="relative z-10">
        {clerkBrowserEnabled() ? <SignUp 
          path="/sign-up" 
          routing="path" 
          signInUrl="/sign-in" 
          forceRedirectUrl="/dashboard" 
        /> : (
          <p className="text-sm text-zinc-400">Registrace není nakonfigurovaná.</p>
        )}
      </div>
    </div>
  );
}