import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, Clock, Home, QrCode, Settings } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/app-context";

interface ShellProps {
  children: ReactNode;
  title?: string;
  back?: string;
  hideNav?: boolean;
  action?: ReactNode;
}

export function MobileShell({ children, title, back, hideNav, action }: ShellProps) {
  const t = useT();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const tabs = [
    { to: "/", icon: Home, label: t("home") },
    { to: "/qrs", icon: QrCode, label: t("myQrs") },
    { to: "/history", icon: Clock, label: t("history") },
    { to: "/settings", icon: Settings, label: t("settings") },
  ];

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      {title && (
        <header className="safe-top sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/90 px-4 pb-3 backdrop-blur">
          {back && (
            <Link
              to={back}
              aria-label="Retour"
              className="flex size-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
            >
              <ArrowLeft className="size-5" />
            </Link>
          )}
          <h1 className="flex-1 truncate text-lg font-semibold">{title}</h1>
          {action}
        </header>
      )}

      <main className={cn("flex-1 px-4 pt-4", hideNav ? "pb-8" : "pb-28")}>{children}</main>

      {!hideNav && (
        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 mx-auto flex w-full max-w-md justify-around border-t border-border bg-background/95 pt-2 backdrop-blur">
          {tabs.map((tab) => {
            const active = tab.to === "/" ? pathname === "/" : pathname.startsWith(tab.to);
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={cn(
                  "flex min-w-16 flex-col items-center gap-1 rounded-xl px-3 py-1 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <tab.icon className={cn("size-6", active && "stroke-[2.4]")} />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
