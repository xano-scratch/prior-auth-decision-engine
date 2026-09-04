import { table, f } from "@xanots/sdk";
import { criteriaSets } from "./criteria-sets.js";

/**
 * The ordered rules inside a set (the decision waterfall). The engine walks
 * them in `sequence` order and applies each rule to the request:
 *   - a rule that PASSES falls through to the next,
 *   - a rule that FAILS yields its `outcome_if_fail` (deny or refer) and stops,
 *   - passing every rule yields approve.
 *
 * `field` names which request value the rule reads, `operator` how it compares,
 * and `value` the comparison target (a single value, or a comma list for `in`).
 */
export const criteria = table({
  name: "criteria",
  schema: {
    criteria_set_id: f.tableRef(criteriaSets, { required: true }),
    sequence: f.int({ required: true }),
    label: f.text({ required: true }),
    field: f.enum(["age", "diagnosis_code", "prior_conservative_therapy_weeks", "bmi", "plan"], { required: true }),
    operator: f.enum(["gte", "lte", "eq", "in", "exists"], { required: true }),
    value: f.text({ required: true }),
    outcome_if_fail: f.enum(["deny", "refer"], { required: true }),
  },
  index: [{ type: "btree", fields: [{ name: "criteria_set_id" }, { name: "sequence" }] }],
  seed: [
    // Set 1 — MRI Lumbar Spine v1 (retired).
    { id: 1, criteria_set_id: 1, sequence: 1, label: "Member is 18 or older", field: "age", operator: "gte", value: "18", outcome_if_fail: "refer" },
    { id: 2, criteria_set_id: 1, sequence: 2, label: "At least 4 weeks of conservative therapy", field: "prior_conservative_therapy_weeks", operator: "gte", value: "4", outcome_if_fail: "deny" },
    // Set 2 — MRI Lumbar Spine v2 (active).
    { id: 3, criteria_set_id: 2, sequence: 1, label: "Member is 18 or older", field: "age", operator: "gte", value: "18", outcome_if_fail: "refer" },
    { id: 4, criteria_set_id: 2, sequence: 2, label: "Covered lumbar diagnosis on file", field: "diagnosis_code", operator: "in", value: "M54.16,M54.17,M51.26,M54.5", outcome_if_fail: "deny" },
    { id: 5, criteria_set_id: 2, sequence: 3, label: "At least 6 weeks of conservative therapy", field: "prior_conservative_therapy_weeks", operator: "gte", value: "6", outcome_if_fail: "deny" },
    // Set 3 — Total Knee Replacement v1 (active).
    { id: 6, criteria_set_id: 3, sequence: 1, label: "Member is 50 or older", field: "age", operator: "gte", value: "50", outcome_if_fail: "refer" },
    { id: 7, criteria_set_id: 3, sequence: 2, label: "BMI is 40 or below", field: "bmi", operator: "lte", value: "40", outcome_if_fail: "refer" },
    { id: 8, criteria_set_id: 3, sequence: 3, label: "At least 12 weeks of conservative therapy", field: "prior_conservative_therapy_weeks", operator: "gte", value: "12", outcome_if_fail: "deny" },
    // Set 4 — CPAP Device v1 (active).
    { id: 9, criteria_set_id: 4, sequence: 1, label: "Sleep apnea diagnosis on file", field: "diagnosis_code", operator: "in", value: "G47.33,G47.30,G47.31", outcome_if_fail: "deny" },
    { id: 10, criteria_set_id: 4, sequence: 2, label: "Member is 18 or older", field: "age", operator: "gte", value: "18", outcome_if_fail: "refer" },
    // Set 5 — Specialty Oncology Infusion v1 (active).
    { id: 11, criteria_set_id: 5, sequence: 1, label: "Diagnosis code provided", field: "diagnosis_code", operator: "exists", value: "", outcome_if_fail: "deny" },
    { id: 12, criteria_set_id: 5, sequence: 2, label: "Plan covers specialty oncology drugs", field: "plan", operator: "in", value: "ppo,medicare_advantage", outcome_if_fail: "refer" },
  ],
});
