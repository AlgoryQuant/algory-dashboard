"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-[#050505] w-full relative z-50">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/20 via-[#050505] to-[#050505] z-0" />
      <div className="relative z-10">
        <SignUp 
          path="/sign-up" 
          routing="path" 
          signInUrl="/sign-in" 
          forceRedirectUrl="/terminal" 
        />
      </div>
    </div>
  );
}