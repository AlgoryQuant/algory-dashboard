import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { dark } from "@clerk/themes";
import { clerkBrowserEnabled } from "@/lib/clerk-browser";
import { clerkKeysConfigured } from "@/lib/clerk-configured";
import { themeInitScript } from "@/lib/theme";
import { GlobalThemeToggle } from "./GlobalThemeToggle";
import { ThemeProvider } from "./ThemeProvider";

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
  // Auth needs both keys. The provider needs the publishable key, which is
  // also what client hooks check. With neither key, skip Clerk entirely so
  // production prerender does not throw and the keyless dev panel stays hidden.
  const clerkOn = clerkKeysConfigured();
  const showClerk = clerkBrowserEnabled();
  let userId: string | null = null;
  if (clerkOn) {
    try {
      userId = (await auth()).userId;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') throw error;
      userId = null;
    }
  }

  const page = (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <div className="fixed top-6 right-6 lg:top-8 lg:right-8 z-[100] flex items-center gap-3">
            <GlobalThemeToggle />
            {userId && (
              <>
                <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-full border border-edge bg-background/50 backdrop-blur-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted">System Online</span>
                </div>
                <div className="p-0.5 rounded-full border border-edge bg-background/80 hover:border-foreground/20 transition-colors shadow-2xl">
                  <UserButton
                    appearance={{
                      elements: {
                        userButtonAvatarBox: "w-8 h-8 rounded-full border border-transparent",
                        userButtonPopoverActionButtonIcon: "text-zinc-400"
                      }
                    }}
                  />
                </div>
              </>
            )}
          </div>

          {children}
        </ThemeProvider>
      </body>
    </html>
  );

  if (!showClerk) {
    return page;
  }

  return (
    <ClerkProvider
      appearance={
        {
          baseTheme: dark,
          options: {
            unsafe_disableDevelopmentModeWarnings: true,
          },
          elements: {
            card: "bg-[#050505] border border-white/10 shadow-2xl",
            navbar: "hidden",
            headerTitle: "text-white font-black",
            headerSubtitle: "text-zinc-400",
            formButtonPrimary: "bg-white text-black hover:bg-zinc-200 font-bold tracking-widest uppercase text-xs transition-colors",
            formFieldInput: "bg-black border border-white/10 focus:border-white/30 text-white transition-all",
            formFieldLabel: "text-zinc-400 font-medium text-xs uppercase tracking-widest",
            socialButtonsBlockButton: "bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all",
            socialButtonsBlockButtonText: "text-white font-medium",
            dividerLine: "bg-white/10",
            dividerText: "text-zinc-500 text-xs uppercase tracking-widest",
            footerActionText: "text-zinc-400",
            footerActionLink: "text-emerald-400 hover:text-emerald-300 font-bold",
            userButtonPopoverCard: "bg-[#050505] border border-white/10 shadow-2xl rounded-xl",
            userButtonPopoverActionButton: "hover:bg-white/5 transition-colors",
            userButtonPopoverActionButtonText: "text-zinc-300 font-medium",
            userButtonPopoverFooter: "hidden"
          }
        } as any
      }
    >
      {page}
    </ClerkProvider>
  );
}
