import { table, f } from "@xanots/sdk";
import { procedures } from "./procedures.js";

/**
 * A versioned ruleset for one procedure. Exactly one set is `active` per
 * procedure at a time; older sets are `retired` but kept, so a decision made
 * under an earlier version stays auditable. This is the versioning the whole
 * engine is built to prove: the MRI Lumbar Spine procedure carries a retired
 * v1 and an active v2 in seed data.
 */
export const criteriaSets = table({
  name: "criteria_sets",
  schema: {
    procedure_id: f.tableRef(procedures, { required: true }),
    version: f.int({ required: true }),
    effective_date: f.date({ required: true }),
    status: f.enum(["draft", "active", "retired"], { required: true }),
    notes: f.text({ required: true }),
  },
  index: [{ type: "btree", fields: [{ name: "procedure_id" }, { name: "status" }] }],
  seed: [
    { id: 1, procedure_id: 1, version: 1, effective_date: "2024-01-01", status: "retired", notes: "Initial lumbar MRI policy: age and 4 weeks of conservative therapy." },
    { id: 2, procedure_id: 1, version: 2, effective_date: "2025-06-01", status: "active", notes: "Updated lumbar MRI policy: covered diagnosis and 6 weeks of conservative therapy." },
    { id: 3, procedure_id: 2, version: 1, effective_date: "2025-01-01", status: "active", notes: "Total knee replacement medical necessity." },
    { id: 4, procedure_id: 3, version: 1, effective_date: "2025-01-01", status: "active", notes: "CPAP device eligibility." },
    { id: 5, procedure_id: 5, version: 1, effective_date: "2025-03-01", status: "active", notes: "Specialty oncology infusion coverage." },
  ],
});
