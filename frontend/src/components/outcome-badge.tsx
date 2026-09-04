import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";
import { outcomeMeta, type Outcome } from "@/lib/format";

const ICONS = {
  approve: CheckCircle2,
  deny: XCircle,
  refer: AlertTriangle,
} as const;

export function OutcomeBadge({ outcome, className }: { outcome: Outcome; className?: string }) {
  const meta = outcomeMeta(outcome);
  const Icon = ICONS[outcome as keyof typeof ICONS] ?? AlertTriangle;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        meta.badge,
        className,
      )}
    >
      <Icon className="size-3.5" />
      {meta.label}
    </span>
  );
}
