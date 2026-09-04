import { table, f } from "@xanots/sdk";
import { requests } from "./requests.js";
import { criteriaSets } from "./criteria-sets.js";
import { criteria } from "./criteria.js";

/**
 * The engine's output for a request, one row per request (the unique index on
 * `request_id` makes the write an upsert). `criteria_set_id` records the exact
 * version that was applied and `deciding_criteria_id` the rule that fired.
 *
 * Both foreign keys are optional and use the `0` sentinel rather than null (an
 * unset foreign key stored as null is unqueryable): a clean approve and the
 * short-circuit both leave `deciding_criteria_id` 0, and the short-circuit
 * leaves `criteria_set_id` 0 because no ruleset ran.
 */
export const decisions = table({
  name: "decisions",
  schema: {
    request_id: f.tableRef(requests, { required: true }),
    criteria_set_id: f.tableRef(criteriaSets, { required: true, default: 0 }),
    outcome: f.enum(["approve", "deny", "refer"], { required: true }),
    deciding_criteria_id: f.tableRef(criteria, { required: true, default: 0 }),
    rationale: f.text({ required: true }),
  },
  index: [{ type: "unique", fields: [{ name: "request_id" }] }],
  seed: [
    { id: 1, request_id: 1, criteria_set_id: 2, outcome: "approve", deciding_criteria_id: 0, rationale: "All medical-necessity criteria met." },
    { id: 2, request_id: 2, criteria_set_id: 2, outcome: "deny", deciding_criteria_id: 5, rationale: "Denied: At least 6 weeks of conservative therapy." },
    { id: 3, request_id: 3, criteria_set_id: 2, outcome: "refer", deciding_criteria_id: 3, rationale: "Referred to review: Member is 18 or older." },
    { id: 4, request_id: 4, criteria_set_id: 0, outcome: "approve", deciding_criteria_id: 0, rationale: "Procedure does not require prior authorization." },
    { id: 5, request_id: 5, criteria_set_id: 3, outcome: "deny", deciding_criteria_id: 8, rationale: "Denied: At least 12 weeks of conservative therapy." },
    { id: 6, request_id: 6, criteria_set_id: 1, outcome: "approve", deciding_criteria_id: 0, rationale: "All medical-necessity criteria met." },
  ],
});
