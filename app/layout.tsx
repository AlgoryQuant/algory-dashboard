import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { dark } from "@clerk/themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Algory | Quantitative Terminal",
  description: "Advanced quantitative analysis & real-time execution engine.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await auth();

  return (
    <ClerkProvider
      appearance={
        {
          baseTheme: dark,
          variables: {
            colorPrimary: "#ffffff",
            colorBackground: "#050505",
            colorText: "#ffffff",
            colorTextSecondary: "#a1a1aa",
            colorInputBackground: "#18181b",
            colorInputText: "#ffffff",
            borderRadius: "0.5rem",
          },
          elements: {
            card: "bg-[#0a0a0a] border border-white/10 shadow-2xl",
            navbar: "hidden",
            headerTitle: "text-white font-black tracking-tight",
            headerSubtitle: "text-zinc-400",
            formFieldLabel: "text-zinc-300 font-semibold",
            formButtonPrimary: "bg-white text-black hover:bg-zinc-200 font-bold tracking-widest uppercase text-xs transition-colors",
            formFieldInput: "bg-white/5 border border-white/10 focus:border-white/30 transition-all text-white",
            socialButtonsBlockButton: "bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all",
            socialButtonsBlockButtonText: "text-white font-medium",
            dividerText: "text-zinc-500",
            footerActionText: "text-zinc-400",
            footerActionLink: "text-white font-bold hover:text-zinc-200",
            userButtonPopoverCard: "bg-black border border-white/10 shadow-2xl rounded-xl",
            userButtonPopoverActionButton: "hover:bg-white/5 transition-colors",
            userButtonPopoverActionButtonText: "text-zinc-300 font-medium",
            userButtonPopoverFooter: "hidden"
          }
        } as any
      }
    >
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-[#050505] text-white">
          {/* GLOBAL TOP-BAR OVERLAY (Visible only when authenticated) */}
          {userId && (
            <div className="fixed top-6 right-6 lg:top-8 lg:right-8 z-[100] flex items-center gap-4">
              <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-full border border-white/5 bg-black/50 backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">System Online</span>
              </div>
              <div className="p-0.5 rounded-full border border-white/10 bg-black/80 hover:border-white/20 transition-colors shadow-2xl">
                <UserButton 
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "w-8 h-8 rounded-full border border-transparent",
                      userButtonPopoverActionButtonIcon: "text-zinc-400"
                    }
                  }}
                />
              </div>
            </div>
          )}
          
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}