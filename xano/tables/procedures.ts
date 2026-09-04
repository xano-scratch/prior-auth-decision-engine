import { table, f } from "@xanots/sdk";

/**
 * The catalog of procedures a request can be filed against. `requires_auth`
 * gates whether the engine runs the medical-necessity rules at all: a
 * procedure that is not gated short-circuits straight to approve.
 */
export const procedures = table({
  name: "procedures",
  schema: {
    code: f.text({ required: true }),
    name: f.text({ required: true }),
    category: f.enum(["imaging", "surgery", "dme", "specialty_drug", "therapy"], { required: true }),
    requires_auth: f.bool({ required: true }),
  },
  index: [{ type: "unique", fields: [{ name: "code" }] }],
  seed: [
    { id: 1, code: "72148", name: "MRI Lumbar Spine", category: "imaging", requires_auth: true },
    { id: 2, code: "27447", name: "Total Knee Replacement", category: "surgery", requires_auth: true },
    { id: 3, code: "E0601", name: "CPAP Device", category: "dme", requires_auth: true },
    { id: 4, code: "97110", name: "Physical Therapy (per unit)", category: "therapy", requires_auth: false },
    { id: 5, code: "J9299", name: "Specialty Oncology Infusion", category: "specialty_drug", requires_auth: true },
  ],
});
