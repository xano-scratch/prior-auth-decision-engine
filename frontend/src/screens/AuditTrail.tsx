import { useEffect, useState } from "react";
import { Loader2, Search, ScrollText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OutcomeBadge } from "@/components/outcome-badge";
import { api, ApiError, type AuditRow } from "@/lib/api";
import { formatTimestamp } from "@/lib/format";

export function AuditTrail({ navigate }: { navigate: (hash: string) => void }) {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [memberNumber, setMemberNumber] = useState("");
  const [procedureCode, setProcedureCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function search(filters: { member_number?: string; procedure_code?: string }) {
    setLoading(true);
    setError(null);
    try {
      setRows(await api.audit(filters));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load the audit trail.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    search({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <ScrollText className="text-muted-foreground size-5" /> Audit trail
        </h1>
        <p className="text-muted-foreground text-sm">
          Every decision the engine has made, append-only. Search by member number or procedure code.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filter</CardTitle>
          <CardDescription>Leave both blank to see the full trail.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              search({ member_number: memberNumber.trim(), procedure_code: procedureCode.trim() });
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="member">Member number</Label>
              <Input
                id="member"
                value={memberNumber}
                onChange={(e) => setMemberNumber(e.target.value)}
                placeholder="M100001"
                className="w-48"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="procedure">Procedure code</Label>
              <Input
                id="procedure"
                value={procedureCode}
                onChange={(e) => setProcedureCode(e.target.value)}
                placeholder="72148"
                className="w-48"
              />
            </div>
            <Button type="submit" disabled={loading}>
              <Search className="size-4" /> Search
            </Button>
            {(memberNumber || procedureCode) && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setMemberNumber("");
                  setProcedureCode("");
                  search({});
                }}
              >
                Clear
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Decision log</CardTitle>
          <CardDescription>{rows.length} entr{rows.length === 1 ? "y" : "ies"}.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
              <Loader2 className="size-4 animate-spin" /> Loading…
            </div>
          ) : rows.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">No entries match that filter.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When (UTC)</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Procedure</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Rule that fired</TableHead>
                  <TableHead>Actor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`#/d/${row.request_id}`)}
                  >
                    <TableCell className="text-muted-foreground whitespace-nowrap text-xs">
                      {formatTimestamp(row.created_at)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{row.member_number}</TableCell>
                    <TableCell className="font-mono text-xs">{row.procedure_code}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {row.criteria_set_version > 0 ? `v${row.criteria_set_version}` : "—"}
                    </TableCell>
                    <TableCell>
                      <OutcomeBadge outcome={row.outcome} />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{row.deciding_rule_label || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{row.actor}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
