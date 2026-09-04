import { useState } from "react";
import { ShieldCheck, Eye, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEMO_ACCOUNTS = [
  {
    role: "Clinical reviewer",
    name: "Dana Okafor",
    email: "reviewer@examplehealth.test",
    password: "reviewer123",
    blurb: "Runs decisions, views everything.",
    Icon: ShieldCheck,
  },
  {
    role: "Read-only auditor",
    name: "Sam Whitfield",
    email: "auditor@examplehealth.test",
    password: "auditor123",
    blurb: "Views and audits, cannot decide.",
    Icon: Eye,
  },
] as const;

export function SignIn({ onSignIn }: { onSignIn: (email: string, password: string) => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(nextEmail: string, nextPassword: string) {
    setBusy(true);
    setError(null);
    try {
      await onSignIn(nextEmail, nextPassword);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 p-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Prior Authorization Decision Engine</h1>
        <p className="text-muted-foreground text-sm">
          One governed decision service every intake portal and provider tool calls. Sign in with a demo
          reviewer to try it.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {DEMO_ACCOUNTS.map((account) => (
          <button
            key={account.email}
            type="button"
            disabled={busy}
            onClick={() => submit(account.email, account.password)}
            className="border-border bg-card hover:border-primary/50 hover:bg-accent focus-visible:ring-ring flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60"
          >
            <account.Icon className="text-muted-foreground size-5" />
            <span className="mt-1 text-sm font-medium">{account.role}</span>
            <span className="text-muted-foreground text-xs">{account.name}</span>
            <span className="text-muted-foreground/80 mt-1 text-xs">{account.blurb}</span>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Or sign in manually</CardTitle>
          <CardDescription>Use one of the demo credentials above.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              submit(email, password);
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="reviewer@examplehealth.test"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
