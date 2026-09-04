import { useEffect, useState } from "react";
import { Loader2, ListOrdered } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InferRow } from "@xanots/sdk";
import { api, ApiError, type CriteriaView, type Procedure } from "@/lib/api";
import { categoryLabel, ruleText } from "@/lib/format";
import type { criteria } from "../../../xano/tables/criteria.js";

// The active rules come back as `unknown` (the response var is seeded as an
// empty array, then conditionally filled), so recover the row type from the
// table def rather than hand-mirroring the columns.
type Rule = InferRow<typeof criteria>;

function statusBadge(status: string) {
  if (status === "active") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
  if (status === "retired") return "border-border bg-muted text-muted-foreground";
  return "border-amber-500/30 bg-amber-500/10 text-amber-400";
}

export function RuleInspector() {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [procedureId, setProcedureId] = useState("");
  const [view, setView] = useState<CriteriaView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .procedures()
      .then((p) => {
        setProcedures(p);
        const firstGated = p.find((x) => x.requires_auth) ?? p[0];
        if (firstGated) setProcedureId(String(firstGated.id));
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load procedures."));
  }, []);

  useEffect(() => {
    if (!procedureId) return;
    let active = true;
    setLoading(true);
    setError(null);
    api
      .criteria(Number(procedureId))
      .then((v) => active && setView(v))
      .catch((err) => active && setError(err instanceof ApiError ? err.message : "Could not load the ruleset."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [procedureId]);

  const rules: Rule[] = view ? ((view.rules as Rule[]) ?? []) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <ListOrdered className="text-muted-foreground size-5" /> Rule inspector
          </h1>
          <p className="text-muted-foreground text-sm">
            Read the exact logic the engine applies, and every version on record.
          </p>
        </div>
        <div className="w-64">
          <Select value={procedureId} onValueChange={setProcedureId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a procedure" />
            </SelectTrigger>
            <SelectContent>
              {procedures.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.name} · {p.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {loading ? (
        <div className="text-muted-foreground flex items-center gap-2 py-16 text-sm">
          <Loader2 className="size-4 animate-spin" /> Loading ruleset…
        </div>
      ) : view ? (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base">
                    Active ruleset{view.active_set ? ` · v${view.active_set.version}` : ""}
                  </CardTitle>
                  <CardDescription>
                    {view.active_set
                      ? view.active_set.notes
                      : "This procedure is not gated, so no ruleset is applied."}
                  </CardDescription>
                </div>
                <Badge variant="outline">{categoryLabel(view.procedure?.category ?? "")}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {rules.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Rule</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead className="text-right">If it fails</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="text-muted-foreground">{rule.sequence}</TableCell>
                        <TableCell className="font-medium">{rule.label}</TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">
                          {ruleText(rule.field, rule.operator, rule.value)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={
                              rule.outcome_if_fail === "deny" ? "text-red-400" : "text-amber-400"
                            }
                          >
                            {rule.outcome_if_fail === "deny" ? "Deny" : "Refer"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground py-6 text-center text-sm">No active rules for this procedure.</p>
              )}
              {rules.length > 0 && (
                <p className="text-muted-foreground mt-4 text-xs">
                  Rules run top to bottom. The first that fails sets the outcome; passing every rule approves the
                  request.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Version history</CardTitle>
              <CardDescription>Older sets are retired, not deleted, so past decisions stay auditable.</CardDescription>
            </CardHeader>
            <CardContent>
              {view.versions.length > 0 ? (
                <ul className="divide-border divide-y">
                  {view.versions.map((set) => (
                    <li key={set.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div>
                        <div className="text-sm font-medium">Version {set.version}</div>
                        <div className="text-muted-foreground text-xs">
                          Effective {String(set.effective_date)}
                        </div>
                      </div>
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadge(set.status)}`}
                      >
                        {set.status}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground py-4 text-center text-sm">No versions on record.</p>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
