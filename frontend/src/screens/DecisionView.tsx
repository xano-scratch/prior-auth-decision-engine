import { useEffect, useState } from "react";
import { ArrowLeft, FileText, Gavel, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OutcomeBadge } from "@/components/outcome-badge";
import { api, ApiError, type DecisionDetail } from "@/lib/api";
import { categoryLabel, fieldLabel, operatorLabel, outcomeMeta, planLabel, ruleText } from "@/lib/format";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

export function DecisionView({ requestId, navigate }: { requestId: number; navigate: (hash: string) => void }) {
  const [data, setData] = useState<DecisionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api
      .decision(requestId)
      .then((d) => active && setData(d))
      .catch((err) => active && setError(err instanceof ApiError ? err.message : "Could not load the decision."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [requestId]);

  if (loading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-16 text-sm">
        <Loader2 className="size-4 animate-spin" /> Loading decision…
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="space-y-3 py-8 text-center">
          <p className="text-muted-foreground text-sm">{error ?? "No decision found."}</p>
          <Button variant="outline" onClick={() => navigate("#/audit")}>
            <ArrowLeft className="size-4" /> Back to audit trail
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { decision, request, member, procedure, deciding_criterion, criteria_set } = data;
  if (!decision || !request) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-8 text-center text-sm">
          This request has no decision on record yet.
        </CardContent>
      </Card>
    );
  }
  const meta = outcomeMeta(decision.outcome);
  const bmi = request.bmi === null || request.bmi === undefined ? "Not provided" : String(request.bmi);
  const weeks =
    request.prior_conservative_therapy_weeks === null || request.prior_conservative_therapy_weeks === undefined
      ? "Not provided"
      : `${request.prior_conservative_therapy_weeks} weeks`;

  return (
    <div className="space-y-6">
      <div>
        <button
          type="button"
          onClick={() => navigate("#/queue")}
          className="text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" /> Back
        </button>
        <h1 className="text-xl font-semibold tracking-tight">
          {procedure.name} <span className="text-muted-foreground font-mono text-base">({procedure.code})</span>
        </h1>
        <p className="text-muted-foreground text-sm">
          {member.first_name} {member.last_name} · {member.member_number} · {planLabel(member.plan ?? "")}
        </p>
      </div>

      {/* The governed result. */}
      <div className={`rounded-xl border p-5 ${meta.banner}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Gavel className="size-5 opacity-80" />
            <div>
              <div className="text-xs uppercase tracking-wide opacity-70">Determination</div>
              <div className="text-2xl font-semibold">{meta.label}</div>
            </div>
          </div>
          <OutcomeBadge outcome={decision.outcome} className="text-sm" />
        </div>
        <p className="mt-3 text-sm opacity-90">{decision.rationale}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gavel className="text-muted-foreground size-4" /> The rule that fired
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {deciding_criterion ? (
              <>
                <div className="border-border bg-muted/40 rounded-lg border p-3">
                  <div className="font-medium">{deciding_criterion.label}</div>
                  <div className="text-muted-foreground mt-1 font-mono text-xs">
                    {fieldLabel(deciding_criterion.field)} {operatorLabel(deciding_criterion.operator)}{" "}
                    {deciding_criterion.value || "—"}
                  </div>
                </div>
                <p className="text-muted-foreground text-xs">
                  Rule #{deciding_criterion.sequence} in the applied set. It did not pass, so the request was{" "}
                  {decision.outcome === "deny" ? "denied" : "referred to review"}.
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">
                {criteria_set
                  ? "No rule blocked the request. Every criterion in the applied set passed."
                  : "This procedure is not gated, so no medical-necessity rules were applied."}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="text-muted-foreground size-4" /> Ruleset applied
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {criteria_set ? (
              <dl className="grid grid-cols-2 gap-3">
                <Field label="Version" value={`v${criteria_set.version}`} />
                <Field label="Status" value={criteria_set.status} />
                <Field label="Effective" value={String(criteria_set.effective_date)} />
                <Field label="Category" value={categoryLabel(procedure.category ?? "")} />
              </dl>
            ) : (
              <p className="text-muted-foreground">
                No ruleset. The procedure does not require prior authorization.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Request under review</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Diagnosis code" value={<span className="font-mono">{request.diagnosis_code}</span>} />
            <Field label="Patient age" value={request.patient_age} />
            <Field label="BMI" value={bmi} />
            <Field label="Conservative therapy" value={weeks} />
            <Field label="Submitted by" value={request.submitted_by} />
            <Field label="Status" value={request.status} />
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
