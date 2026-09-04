import { table, f } from "@xanots/sdk";
import { members } from "./members.js";
import { procedures } from "./procedures.js";

/**
 * An inbound authorization request. Rows 1-6 are already `decided` (their
 * decisions and audit rows are seeded too) so the app is browsable the moment
 * it deploys. Rows 7-9 are left `pending` so a clinical reviewer can run the
 * decision live and watch an approve, a refer, and a deny come back.
 */
export const requests = table({
  name: "requests",
  schema: {
    member_id: f.tableRef(members, { required: true }),
    procedure_id: f.tableRef(procedures, { required: true }),
    diagnosis_code: f.text({ required: true }),
    patient_age: f.int({ required: true }),
    bmi: f.decimal({ nullable: true }),
    prior_conservative_therapy_weeks: f.int({ nullable: true }),
    submitted_by: f.text({ required: true }),
    status: f.enum(["pending", "decided"], { required: true }),
  },
  seed: [
    { id: 1, member_id: 1, procedure_id: 1, diagnosis_code: "M54.16", patient_age: 45, bmi: 26.5, prior_conservative_therapy_weeks: 8, submitted_by: "intake-portal", status: "decided" },
    { id: 2, member_id: 2, procedure_id: 1, diagnosis_code: "M54.16", patient_age: 50, bmi: 28, prior_conservative_therapy_weeks: 2, submitted_by: "intake-portal", status: "decided" },
    { id: 3, member_id: 3, procedure_id: 1, diagnosis_code: "M54.16", patient_age: 16, bmi: 22, prior_conservative_therapy_weeks: 10, submitted_by: "intake-portal", status: "decided" },
    { id: 4, member_id: 1, procedure_id: 4, diagnosis_code: "M54.5", patient_age: 45, bmi: null, prior_conservative_therapy_weeks: null, submitted_by: "provider-tool", status: "decided" },
    { id: 5, member_id: 2, procedure_id: 2, diagnosis_code: "M17.11", patient_age: 62, bmi: 34, prior_conservative_therapy_weeks: 6, submitted_by: "provider-tool", status: "decided" },
    { id: 6, member_id: 1, procedure_id: 1, diagnosis_code: "M54.5", patient_age: 40, bmi: 25, prior_conservative_therapy_weeks: 5, submitted_by: "intake-portal", status: "decided" },
    { id: 7, member_id: 1, procedure_id: 1, diagnosis_code: "M51.26", patient_age: 52, bmi: 24, prior_conservative_therapy_weeks: 7, submitted_by: "intake-portal", status: "pending" },
    { id: 8, member_id: 2, procedure_id: 5, diagnosis_code: "C50.911", patient_age: 60, bmi: null, prior_conservative_therapy_weeks: null, submitted_by: "provider-tool", status: "pending" },
    { id: 9, member_id: 3, procedure_id: 3, diagnosis_code: "R06.02", patient_age: 55, bmi: 33, prior_conservative_therapy_weeks: null, submitted_by: "provider-tool", status: "pending" },
  ],
});
