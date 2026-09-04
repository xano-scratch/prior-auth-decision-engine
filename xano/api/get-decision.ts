import { query, input, s, ref, inp, c, expr, obj } from "@xanots/sdk";
import { priorauthGroup } from "./groups.js";
import { reviewers } from "../tables/reviewers.js";
import { requests } from "../tables/requests.js";
import { members } from "../tables/members.js";
import { procedures } from "../tables/procedures.js";
import { criteria } from "../tables/criteria.js";
import { criteriaSets } from "../tables/criteria-sets.js";
import { decisions } from "../tables/decisions.js";

/**
 * The full decision for a request, joined to what a reviewer needs to read it:
 * the request, the member, the procedure, the exact criterion that fired, and
 * the criteria set (its version) that was applied. The deciding criterion and
 * the criteria set are read with a field-match get so the `0` sentinel on a
 * clean approve or a short-circuit binds null instead of failing.
 */
export const getDecisionQuery = query({
  name: "decisions/{request_id}",
  verb: "GET",
  apiGroup: priorauthGroup,
  auth: reviewers,
  input: {
    request_id: input.int({ required: true }),
  },
  stack: [
    s.db.get({ table: decisions, fieldName: "request_id", fieldValue: inp("request_id"), as: "decision" }),
    s.precondition({
      expr: expr(ref("decision", { safe: true }), "!=", c.null()),
      error_type: "notfound",
      error: c.text("No decision has been made for this request yet."),
    }),
    s.db.get_by_id({ table: requests, id: ref("decision.request_id"), as: "request" }),
    s.db.get_by_id({ table: members, id: ref("request.member_id"), as: "member" }),
    s.db.get_by_id({ table: procedures, id: ref("request.procedure_id"), as: "procedure" }),
    // Field-match get: the 0 sentinel binds null rather than 400ing.
    s.db.get({ table: criteria, fieldName: "id", fieldValue: ref("decision.deciding_criteria_id"), as: "deciding" }),
    s.db.get({ table: criteriaSets, fieldName: "id", fieldValue: ref("decision.criteria_set_id"), as: "criteria_set" }),
  ],
  response: {
    decision: ref("decision"),
    request: ref("request"),
    member: obj({
      member_number: ref("member.member_number"),
      first_name: ref("member.first_name"),
      last_name: ref("member.last_name"),
      plan: ref("member.plan"),
    }),
    procedure: obj({
      code: ref("procedure.code"),
      name: ref("procedure.name"),
      category: ref("procedure.category"),
      requires_auth: ref("procedure.requires_auth"),
    }),
    deciding_criterion: ref("deciding"),
    criteria_set: ref("criteria_set"),
  },
});
