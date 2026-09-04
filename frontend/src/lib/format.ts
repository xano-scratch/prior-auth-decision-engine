// Small presentation helpers shared across screens. Business logic stays on the
// backend; these only turn stored values into readable labels.

export type Outcome = "approve" | "deny" | "refer" | string;

export interface OutcomeMeta {
  label: string;
  /** Tailwind classes for a status pill (palette colors are intentional here —
   *  a three-way clinical outcome has no single semantic token). */
  badge: string;
  /** Accent classes for a larger result banner. */
  banner: string;
}

export function outcomeMeta(outcome: Outcome): OutcomeMeta {
  switch (outcome) {
    case "approve":
      return {
        label: "Approved",
        badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
        banner: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
      };
    case "deny":
      return {
        label: "Denied",
        badge: "border-red-500/30 bg-red-500/10 text-red-400",
        banner: "border-red-500/30 bg-red-500/10 text-red-300",
      };
    case "refer":
      return {
        label: "Refer to review",
        badge: "border-amber-500/30 bg-amber-500/10 text-amber-400",
        banner: "border-amber-500/30 bg-amber-500/10 text-amber-300",
      };
    default:
      return {
        label: outcome,
        badge: "border-border bg-muted text-muted-foreground",
        banner: "border-border bg-muted text-muted-foreground",
      };
  }
}

const PLAN_LABELS: Record<string, string> = {
  hmo: "HMO",
  ppo: "PPO",
  medicare_advantage: "Medicare Advantage",
};
export const planLabel = (plan: string): string => PLAN_LABELS[plan] ?? plan;

const CATEGORY_LABELS: Record<string, string> = {
  imaging: "Imaging",
  surgery: "Surgery",
  dme: "Durable medical equipment",
  specialty_drug: "Specialty drug",
  therapy: "Therapy",
};
export const categoryLabel = (category: string): string => CATEGORY_LABELS[category] ?? category;

const FIELD_LABELS: Record<string, string> = {
  age: "Patient age",
  diagnosis_code: "Diagnosis code",
  prior_conservative_therapy_weeks: "Conservative therapy (weeks)",
  bmi: "BMI",
  plan: "Plan",
};
export const fieldLabel = (field: string): string => FIELD_LABELS[field] ?? field;

const OPERATOR_LABELS: Record<string, string> = {
  gte: "is at least",
  lte: "is at most",
  eq: "equals",
  in: "is one of",
  exists: "is provided",
};
export const operatorLabel = (operator: string): string => OPERATOR_LABELS[operator] ?? operator;

/** Render a rule as one readable line, e.g. "Patient age is at least 18". */
export function ruleText(field: string, operator: string, value: string): string {
  if (operator === "exists") return `${fieldLabel(field)} ${operatorLabel(operator)}`;
  if (operator === "in") return `${fieldLabel(field)} ${operatorLabel(operator)}: ${value.split(",").join(", ")}`;
  return `${fieldLabel(field)} ${operatorLabel(operator)} ${value}`;
}

/** Format a Xano epoch-ms timestamp (created_at) as a readable UTC string. */
export function formatTimestamp(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const ms = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(ms)) return String(value);
  const d = new Date(ms);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}
