import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left Column — Form */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-8 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex justify-center">
            <Link href="/">
              <Logo variant="blue" width={32} height={32} />
            </Link>
          </div>
          {children}
          <div className="mt-10 flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/terms" className="transition-colors hover:text-foreground">
              Terms
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-foreground">
              Privacy
            </Link>
          </div>
        </div>
      </div>

      {/* Right Column — Full Image Backdrop with Business Patterns */}
      <div className="hidden lg:fixed lg:right-0 lg:block lg:h-screen lg:w-1/2">
        <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-primary">
          {/* Floating pattern icons */}
          <div className="absolute left-[12%] top-[10%] animate-pulse">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
              <svg viewBox="0 0 40 40" className="h-10 w-10 text-white" fill="none">
                <rect x="2" y="6" width="36" height="28" rx="4" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.2"/>
                <path d="M14 18h12M14 24h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="20" cy="14" r="3" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.4"/>
              </svg>
            </div>
          </div>

          <div className="absolute right-[15%] top-[20%] animate-pulse [animation-delay:1s]">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
              <svg viewBox="0 0 40 40" className="h-8 w-8 text-white" fill="none">
                <rect x="2" y="2" width="36" height="36" rx="4" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.2"/>
                <path d="M8 20h24M20 8v24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="20" cy="20" r="6" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.3"/>
              </svg>
            </div>
          </div>

          <div className="absolute bottom-[25%] left-[8%] animate-pulse [animation-delay:0.5s]">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
              <svg viewBox="0 0 48 48" className="h-12 w-12 text-white" fill="none">
                <rect x="2" y="8" width="44" height="32" rx="4" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15"/>
                <path d="M14 20v8M24 16v12M34 12v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="14" cy="30" r="2" fill="currentColor" fillOpacity="0.6"/>
                <circle cx="24" cy="30" r="2" fill="currentColor" fillOpacity="0.6"/>
                <circle cx="34" cy="30" r="2" fill="currentColor" fillOpacity="0.6"/>
              </svg>
            </div>
          </div>

          <div className="absolute right-[10%] bottom-[30%] animate-pulse [animation-delay:2s]">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
              <svg viewBox="0 0 40 40" className="h-10 w-10 text-white" fill="none">
                <circle cx="14" cy="20" r="10" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.2"/>
                <circle cx="26" cy="20" r="10" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.2"/>
                <path d="M4 28c2-4 6-4 8-4s6 0 8 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="currentColor" fillOpacity="0.15"/>
                <path d="M20 28c2-4 6-4 8-4s6 0 8 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="currentColor" fillOpacity="0.15"/>
              </svg>
            </div>
          </div>

          <div className="absolute left-[30%] top-[40%] animate-pulse [animation-delay:1.5s]">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
              <svg viewBox="0 0 32 32" className="h-7 w-7 text-white" fill="none">
                <rect x="2" y="10" width="28" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.2"/>
                <path d="M16 4L2 10h28L16 4z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.3"/>
                <circle cx="16" cy="20" r="3" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.4"/>
              </svg>
            </div>
          </div>

          <div className="absolute bottom-[15%] right-[25%] animate-pulse [animation-delay:0.8s]">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
              <svg viewBox="0 0 40 40" className="h-8 w-8 text-white" fill="none">
                <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15"/>
                <path d="M12 20c0-4 4-8 8-8s8 4 8 8-4 8-8 8-8-4-8-8z" fill="currentColor" fillOpacity="0.2"/>
                <path d="M20 12v16M12 20h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          <div className="absolute left-[5%] top-[55%] animate-pulse [animation-delay:0.3s]">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <svg viewBox="0 0 32 32" className="h-6 w-6 text-white" fill="none">
                <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.3"/>
                <circle cx="22" cy="10" r="6" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.3"/>
                <path d="M6 26c2-6 8-6 10-6s8 0 10 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          <div className="absolute right-[8%] top-[55%] animate-pulse [animation-delay:1.8s]">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <svg viewBox="0 0 32 32" className="h-7 w-7 text-white" fill="none">
                <rect x="2" y="4" width="28" height="24" rx="4" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.2"/>
                <path d="M2 12h28" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M10 18h4M18 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          {/* Grid pattern overlay */}
          <svg className="absolute inset-0 h-full w-full opacity-[0.04]">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)"/>
          </svg>

          {/* Dot pattern */}
          <svg className="absolute inset-0 h-full w-full opacity-[0.06]">
            <defs>
              <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="white"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)"/>
          </svg>

          {/* Radial glow */}
          <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-3xl" />

          {/* Bottom branding */}
          <div className="absolute bottom-12 left-0 right-0 z-10 px-12 text-center">
            <h2 className="mb-2 text-xl font-bold tracking-tight text-white">
              Enkai Business
            </h2>
            <p className="mx-auto max-w-xs text-sm leading-relaxed text-white/60">
              AI-first, multi-industry platform for Africa and emerging markets
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
