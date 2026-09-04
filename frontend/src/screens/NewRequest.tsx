import { useEffect, useState } from "react";
import { Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, ApiError, type Member, type Procedure } from "@/lib/api";
import { planLabel } from "@/lib/format";

export function NewRequest({ navigate }: { navigate: (hash: string) => void }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [memberId, setMemberId] = useState("");
  const [procedureId, setProcedureId] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [age, setAge] = useState("");
  const [bmi, setBmi] = useState("");
  const [weeks, setWeeks] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([api.members(), api.procedures()])
      .then(([m, p]) => {
        setMembers(m);
        setProcedures(p);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load form data."));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!memberId || !procedureId || !diagnosis || !age) {
      setError("Member, procedure, diagnosis code, and patient age are required.");
      return;
    }
    setBusy(true);
    try {
      const result = await api.submit({
        member_id: Number(memberId),
        procedure_id: Number(procedureId),
        diagnosis_code: diagnosis,
        patient_age: Number(age),
        bmi: bmi === "" ? null : Number(bmi),
        prior_conservative_therapy_weeks: weeks === "" ? null : Number(weeks),
      });
      const requestId = result.request.id;
      // A non-gated procedure comes back already decided; otherwise run the
      // governed decision now.
      if (!result.decision) {
        await api.decide(requestId);
      }
      navigate(`#/d/${requestId}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Submission failed.");
      setBusy(false);
    }
  }

  const selectedProcedure = procedures.find((p) => String(p.id) === procedureId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">New authorization request</h1>
        <p className="text-muted-foreground text-sm">
          Submit a request, then run the decision. The engine applies the active ruleset and records the
          result.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Request details</CardTitle>
          <CardDescription>All fields marked required drive the medical-necessity rules.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Member</Label>
                <Select value={memberId} onValueChange={setMemberId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a member" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.first_name} {m.last_name} · {m.member_number} ({planLabel(m.plan)})
                        {m.active ? "" : " — inactive"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Procedure</Label>
                <Select value={procedureId} onValueChange={setProcedureId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a procedure" />
                  </SelectTrigger>
                  <SelectContent>
                    {procedures.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name} · {p.code}
                        {p.requires_auth ? "" : " — no auth needed"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedProcedure && !selectedProcedure.requires_auth && (
              <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                This procedure is not gated. Submitting will approve it automatically, with no criteria walked.
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="diagnosis">Diagnosis code</Label>
                <Input
                  id="diagnosis"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. M54.16"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="age">Patient age</Label>
                <Input id="age" type="number" min={0} value={age} onChange={(e) => setAge(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bmi">BMI (optional)</Label>
                <Input
                  id="bmi"
                  type="number"
                  step="0.1"
                  min={0}
                  value={bmi}
                  onChange={(e) => setBmi(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="weeks">Conservative therapy weeks (optional)</Label>
                <Input
                  id="weeks"
                  type="number"
                  min={0}
                  value={weeks}
                  onChange={(e) => setWeeks(e.target.value)}
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <Button type="submit" disabled={busy} className="w-full sm:w-auto">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Submit and decide
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
