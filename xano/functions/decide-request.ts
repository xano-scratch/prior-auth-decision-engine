import { defineFunction, input, s, ref, inp, c, expr, col } from "@xanots/sdk";
import { requests } from "../tables/requests.js";
import { members } from "../tables/members.js";
import { procedures } from "../tables/procedures.js";
import { criteriaSets } from "../tables/criteria-sets.js";
import { criteria } from "../tables/criteria.js";
import { decisions } from "../tables/decisions.js";
import { decisionLog } from "../tables/decision-log.js";

/**
 * The governed rule. Every decision the system produces runs through this one
 * function, so an intake portal and a provider tool cannot each re-encode their
 * own medical-necessity logic. It:
 *
 *   1. loads the request, its member, and the requested procedure;
 *   2. short-circuits to approve when the procedure is not gated;
 *   3. otherwise loads the ACTIVE criteria set and walks its rules in order —
 *      the first rule that fails yields its outcome (deny or refer) and the
 *      rule that fired; passing every rule yields approve;
 *   4. upserts the decision, appends an append-only audit row, and flips the
 *      request to decided.
 *
 * The waterfall itself is one lambda: the rules are variable in number and mix
 * field types and operators, which the typed statement surface cannot express
 * cleanly. The lambda returns plain values that are written straight into the
 * typed decision columns, so its result shape never reaches the frontend.
 */
export const decideRequest = defineFunction({
  name: "decide_request",
  input: {
    request_id: input.int({ required: true }),
    actor: input.text({ required: true }),
  },
  stack: [
    s.db.get_by_id({ table: requests, id: inp("request_id"), as: "req" }),
    s.precondition({
      expr: expr(ref("req", { safe: true }), "!=", c.null()),
      error_type: "notfound",
      error: c.text("Request not found."),
    }),
    s.db.get_by_id({ table: members, id: ref("req.member_id"), as: "member" }),
    s.db.get_by_id({ table: procedures, id: ref("req.procedure_id"), as: "proc" }),
    s.precondition({
      expr: expr(ref("proc", { safe: true }), "!=", c.null()),
      error_type: "notfound",
      error: c.text("Procedure not found."),
    }),

    // Defaults describe the short-circuit approve (no ruleset ran). The gated
    // branch below overrides them with the outcome of the waterfall.
    s.set_var("csid", c.int(0)),
    s.set_var("version", c.int(0)),
    s.set_var("outcome", c.text("approve")),
    s.set_var("deciding_id", c.int(0)),
    s.set_var("deciding_label", c.text("")),
    s.set_var("rationale", c.text("Procedure does not require prior authorization.")),

    s.conditional({
      when: expr(ref("proc.requires_auth"), "=", c.bool(true)),
      then: [
        s.db.query({
          table: criteriaSets,
          where: [expr(col("procedure_id"), "=", ref("proc.id")), expr(col("status"), "=", c.text("active"))],
          returnType: "single",
          as: "cs",
        }),
        s.precondition({
          expr: expr(ref("cs", { safe: true }), "!=", c.null()),
          error_type: "notfound",
          error: c.text("No active criteria set for this procedure."),
        }),
        s.db.query({
          table: criteria,
          where: expr(col("criteria_set_id"), "=", ref("cs.id")),
          sort: [{ sortBy: "sequence", dir: "asc" }],
          as: "rules",
        }),
        s.lambda({
          as: "result",
          code: ({ $var }) => {
            const req = ($var.req ?? {}) as Record<string, unknown>;
            const member = ($var.member ?? {}) as Record<string, unknown>;
            const rules = (Array.isArray($var.rules) ? $var.rules : []) as Array<Record<string, unknown>>;

            const isEmpty = (v: unknown) => v === null || v === undefined || v === "";
            const readField = (field: unknown): unknown => {
              switch (field) {
                case "age":
                  return req.patient_age;
                case "diagnosis_code":
                  return req.diagnosis_code;
                case "prior_conservative_therapy_weeks":
                  return req.prior_conservative_therapy_weeks;
                case "bmi":
                  return req.bmi;
                case "plan":
                  return member.plan;
                default:
                  return null;
              }
            };

            for (const rule of rules) {
              const lhs = readField(rule.field);
              const target = rule.value;
              let pass = false;
              switch (rule.operator) {
                case "gte":
                  pass = !isEmpty(lhs) && Number(lhs) >= Number(target);
                  break;
                case "lte":
                  pass = !isEmpty(lhs) && Number(lhs) <= Number(target);
                  break;
                case "eq":
                  pass = String(lhs) === String(target);
                  break;
                case "in":
                  pass = String(target)
                    .split(",")
                    .map((s) => s.trim())
                    .includes(String(lhs));
                  break;
                case "exists":
                  pass = !isEmpty(lhs);
                  break;
                default:
                  pass = false;
              }
              if (!pass) {
                const verb = rule.outcome_if_fail === "deny" ? "Denied" : "Referred to review";
                return {
                  outcome: rule.outcome_if_fail,
                  deciding_id: rule.id,
                  deciding_label: rule.label,
                  rationale: verb + ": " + rule.label + ".",
                };
              }
            }
            return {
              outcome: "approve",
              deciding_id: 0,
              deciding_label: "",
              rationale: "All medical-necessity criteria met.",
            };
          },
        }),
        s.update_var("csid", ref("cs.id")),
        s.update_var("version", ref("cs.version")),
        s.update_var("outcome", ref("result.outcome")),
        s.update_var("deciding_id", ref("result.deciding_id")),
        s.update_var("deciding_label", ref("result.deciding_label")),
        s.update_var("rationale", ref("result.rationale")),
      ],
    }),

    // One decision per request (the unique index makes this an upsert).
    s.db.add_or_edit({
      table: decisions,
      fieldName: "request_id",
      fieldValue: ref("req.id"),
      row: {
        request_id: ref("req.id"),
        criteria_set_id: ref("csid"),
        outcome: ref("outcome"),
        deciding_criteria_id: ref("deciding_id"),
        rationale: ref("rationale"),
      },
      as: "decision",
    }),

    // Append-only: every run writes a fresh audit row, never edits one.
    s.db.add({
      table: decisionLog,
      row: {
        request_id: ref("req.id"),
        member_number: ref("member.member_number"),
        procedure_code: ref("proc.code"),
        criteria_set_version: ref("version"),
        outcome: ref("outcome"),
        deciding_rule_label: ref("deciding_label"),
        actor: inp("actor"),
      },
      as: "log",
    }),

    s.db.edit({
      table: requests,
      fieldName: "id",
      fieldValue: ref("req.id"),
      row: { status: c.text("decided") },
      as: "updated",
    }),
  ],
  response: {
    request_id: ref("req.id"),
    outcome: ref("outcome"),
    deciding_criteria_id: ref("deciding_id"),
    deciding_rule_label: ref("deciding_label"),
    rationale: ref("rationale"),
    criteria_set_id: ref("csid"),
    criteria_set_version: ref("version"),
  },
});
