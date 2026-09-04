import { useEffect, useState } from "react";
import { Inbox, Loader2, Gavel } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, ApiError, type Member, type Procedure, type QueueRequest, type Reviewer } from "@/lib/api";
import { planLabel } from "@/lib/format";

export function Queue({ reviewer, navigate }: { reviewer: Reviewer; navigate: (hash: string) => void }) {
  const [rows, setRows] = useState<QueueRequest[]>([]);
  const [members, setMembers] = useState<Record<number, Member>>({});
  const [procedures, setProcedures] = useState<Record<number, Procedure>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deciding, setDeciding] = useState<number | null>(null);

  const canDecide = reviewer.role === "clinical_reviewer";

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [queue, memberList, procedureList] = await Promise.all([
        api.queue(),
        api.members(),
        api.procedures(),
      ]);
      setRows(queue);
      setMembers(Object.fromEntries(memberList.map((m) => [m.id, m])));
      setProcedures(Object.fromEntries(procedureList.map((p) => [p.id, p])));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load the queue.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function decide(requestId: number) {
    setDeciding(requestId);
    setError(null);
    try {
      await api.decide(requestId);
      navigate(`#/d/${requestId}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not run the decision.");
      setDeciding(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <Inbox className="text-muted-foreground size-5" /> Pending queue
          </h1>
          <p className="text-muted-foreground text-sm">Requests awaiting a medical-necessity decision.</p>
        </div>
        {canDecide && (
          <Button onClick={() => navigate("#/new")} variant="outline">
            New request
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Intake</CardTitle>
          <CardDescription>
            {canDecide
              ? "Run a decision to apply the active ruleset and write the audit trail."
              : "You are signed in as a read-only auditor, so the decide action is hidden."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
              <Loader2 className="size-4 animate-spin" /> Loading queue…
            </div>
          ) : rows.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              The queue is empty. Every request has been decided.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Procedure</TableHead>
                  <TableHead>Diagnosis</TableHead>
                  <TableHead className="text-right">Age</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const member = members[row.member_id];
                  const procedure = procedures[row.procedure_id];
                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="font-medium">
                          {member ? `${member.first_name} ${member.last_name}` : `Member ${row.member_id}`}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {member ? `${member.member_number} · ${planLabel(member.plan)}` : ""}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{procedure ? procedure.name : `Procedure ${row.procedure_id}`}</div>
                        <div className="text-muted-foreground font-mono text-xs">{procedure?.code}</div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{row.diagnosis_code}</TableCell>
                      <TableCell className="text-right">{row.patient_age}</TableCell>
                      <TableCell className="text-right">
                        {canDecide && (
                          <Button size="sm" disabled={deciding === row.id} onClick={() => decide(row.id)}>
                            {deciding === row.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Gavel className="size-4" />
                            )}
                            Decide
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
