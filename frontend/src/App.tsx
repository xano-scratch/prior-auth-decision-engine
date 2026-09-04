import { useEffect, useState } from "react";
import { Activity, LogOut } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api, ApiError, getToken, setToken, type Reviewer } from "@/lib/api";
import { SignIn } from "@/screens/SignIn";
import { Queue } from "@/screens/Queue";
import { NewRequest } from "@/screens/NewRequest";
import { DecisionView } from "@/screens/DecisionView";
import { RuleInspector } from "@/screens/RuleInspector";
import { AuditTrail } from "@/screens/AuditTrail";

function useHashRoute(): string {
  const [hash, setHash] = useState(() => (typeof window !== "undefined" ? window.location.hash : ""));
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
}

const navigate = (hash: string) => {
  window.location.hash = hash;
};

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </a>
  );
}

export default function App() {
  const hash = useHashRoute();
  const [reviewer, setReviewer] = useState<Reviewer | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setBooting(false);
      return;
    }
    api
      .me()
      .then((me) => setReviewer(me))
      .catch(() => {
        setToken(null);
        setReviewer(null);
      })
      .finally(() => setBooting(false));
  }, []);

  async function signIn(email: string, password: string) {
    const res = await api.login({ email, password });
    setToken(res.token);
    setReviewer(res.reviewer);
    navigate("#/queue");
  }

  function signOut() {
    setToken(null);
    setReviewer(null);
    navigate("#/");
  }

  if (booting) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Activity className="text-muted-foreground size-6 animate-pulse" />
      </main>
    );
  }

  if (!reviewer) {
    return <SignIn onSignIn={signIn} />;
  }

  const isClinical = reviewer.role === "clinical_reviewer";
  const route = hash.replace(/^#/, "") || "/queue";
  const decisionMatch = route.match(/^\/d\/(\d+)/);

  let screen: React.ReactNode;
  if (decisionMatch) {
    screen = <DecisionView requestId={Number(decisionMatch[1])} navigate={navigate} />;
  } else if (route.startsWith("/new") && isClinical) {
    screen = <NewRequest navigate={navigate} />;
  } else if (route.startsWith("/rules")) {
    screen = <RuleInspector />;
  } else if (route.startsWith("/audit")) {
    screen = <AuditTrail navigate={navigate} />;
  } else {
    screen = <Queue reviewer={reviewer} navigate={navigate} />;
  }

  return (
    <div className="min-h-screen">
      <header className="border-border bg-card/40 sticky top-0 z-10 border-b backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-6 py-3">
          <a href="#/queue" className="flex items-center gap-2 font-semibold tracking-tight">
            <Activity className="text-primary size-5" />
            <span className="hidden sm:inline">Prior Auth Engine</span>
          </a>
          <nav className="flex items-center gap-1">
            <NavLink href="#/queue" active={route.startsWith("/queue") || route === "/"}>
              Queue
            </NavLink>
            {isClinical && (
              <NavLink href="#/new" active={route.startsWith("/new")}>
                New request
              </NavLink>
            )}
            <NavLink href="#/rules" active={route.startsWith("/rules")}>
              Rules
            </NavLink>
            <NavLink href="#/audit" active={route.startsWith("/audit")}>
              Audit
            </NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium leading-tight">{reviewer.name}</div>
              <div className="text-muted-foreground text-xs leading-tight">{reviewer.email}</div>
            </div>
            <Badge variant={isClinical ? "default" : "secondary"}>
              {isClinical ? "Clinical reviewer" : "Read-only"}
            </Badge>
            <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">{screen}</main>
    </div>
  );
}
