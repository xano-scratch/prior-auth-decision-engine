import { query, input, s, ref, inp, auth, c, expr } from "@xanots/sdk";
import { priorauthGroup } from "./groups.js";
import { reviewers } from "../tables/reviewers.js";
import { members } from "../tables/members.js";
import { procedures } from "../tables/procedures.js";
import { requests } from "../tables/requests.js";
import { decideRequest } from "../functions/decide-request.js";

/**
 * Submit an authorization request. Validates that the member is active and the
 * procedure exists, then creates the request as pending. When the procedure is
 * not gated (requires_auth is false), it short-circuits: the shared decision
 * function runs and approves it immediately with the reason "procedure does not
 * require prior authorization", so no criteria are walked. A gated procedure is
 * left pending for a clinical reviewer to decide.
 */
export const submitRequestQuery = query({
  name: "requests",
  verb: "POST",
  apiGroup: priorauthGroup,
  auth: reviewers,
  input: {
    member_id: input.int({ required: true }),
    procedure_id: input.int({ required: true }),
    diagnosis_code: input.text({ required: true, methods: ["trim", "upper"] }),
    patient_age: input.int({ required: true }),
    bmi: input.decimal({ nullable: true }),
    prior_conservative_therapy_weeks: input.int({ nullable: true }),
  },
  stack: [
    s.db.get_by_id({ table: reviewers, id: auth("id"), output: ["id", "email"], as: "caller" }),

    s.db.get_by_id({ table: members, id: inp("member_id"), as: "member" }),
    s.precondition({
      expr: expr(ref("member", { safe: true }), "!=", c.null()),
      error_type: "notfound",
      error: c.text("Member not found."),
    }),
    s.precondition({
      expr: expr(ref("member.active"), "=", c.bool(true)),
      error_type: "badrequest",
      error: c.text("Member is not active on the plan."),
    }),

    s.db.get_by_id({ table: procedures, id: inp("procedure_id"), as: "procedure" }),
    s.precondition({
      expr: expr(ref("procedure", { safe: true }), "!=", c.null()),
      error_type: "notfound",
      error: c.text("Procedure not found."),
    }),

    s.db.add({
      table: requests,
      row: {
        member_id: inp("member_id"),
        procedure_id: inp("procedure_id"),
        diagnosis_code: inp("diagnosis_code"),
        patient_age: inp("patient_age"),
        bmi: inp("bmi"),
        prior_conservative_therapy_weeks: inp("prior_conservative_therapy_weeks"),
        submitted_by: ref("caller.email"),
        status: c.text("pending"),
      },
      as: "request",
    }),

    // The short-circuit lives here so a non-gated procedure comes back already
    // decided; a gated one stays pending until /decide runs.
    s.set_var("decision", c.null()),
    s.conditional({
      when: expr(ref("procedure.requires_auth"), "=", c.bool(false)),
      then: [
        s.function.run({
          fn: decideRequest,
          input: { request_id: ref("request.id"), actor: ref("caller.email") },
          as: "sc",
        }),
        s.update_var("decision", ref("sc")),
      ],
    }),
  ],
  response: {
    request: ref("request"),
    requires_auth: ref("procedure.requires_auth"),
    decision: ref("decision"),
  },
});
