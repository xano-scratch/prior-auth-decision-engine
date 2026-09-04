import { table, f } from "@xanots/sdk";

/**
 * The append-only audit trail: one row per engine run, never mutated. Key
 * fields are denormalized (member number, procedure code, the version applied)
 * so an auditor can query the trail by member or by procedure without joining
 * back to live rows that may have changed since. Row 6 records a decision made
 * under the retired MRI v1, so the trail shows both versions in use over time.
 */
export const decisionLog = table({
  name: "decision_log",
  schema: {
    request_id: f.int({ required: true }),
    member_number: f.text({ required: true }),
    procedure_code: f.text({ required: true }),
    criteria_set_version: f.int({ required: true }),
    outcome: f.text({ required: true }),
    deciding_rule_label: f.text(),
    actor: f.text({ required: true }),
  },
  index: [
    { type: "btree", fields: [{ name: "member_number" }] },
    { type: "btree", fields: [{ name: "procedure_code" }] },
  ],
  seed: [
    { id: 1, request_id: 1, member_number: "M100001", procedure_code: "72148", criteria_set_version: 2, outcome: "approve", deciding_rule_label: "", actor: "reviewer@examplehealth.test" },
    { id: 2, request_id: 2, member_number: "M100002", procedure_code: "72148", criteria_set_version: 2, outcome: "deny", deciding_rule_label: "At least 6 weeks of conservative therapy", actor: "reviewer@examplehealth.test" },
    { id: 3, request_id: 3, member_number: "M100003", procedure_code: "72148", criteria_set_version: 2, outcome: "refer", deciding_rule_label: "Member is 18 or older", actor: "reviewer@examplehealth.test" },
    { id: 4, request_id: 4, member_number: "M100001", procedure_code: "97110", criteria_set_version: 0, outcome: "approve", deciding_rule_label: "", actor: "reviewer@examplehealth.test" },
    { id: 5, request_id: 5, member_number: "M100002", procedure_code: "27447", criteria_set_version: 1, outcome: "deny", deciding_rule_label: "At least 12 weeks of conservative therapy", actor: "reviewer@examplehealth.test" },
    { id: 6, request_id: 6, member_number: "M100001", procedure_code: "72148", criteria_set_version: 1, outcome: "approve", deciding_rule_label: "", actor: "system-migration" },
  ],
});
