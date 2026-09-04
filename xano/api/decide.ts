import { query, input, s, ref, inp, auth, c, expr } from "@xanots/sdk";
import { priorauthGroup } from "./groups.js";
import { reviewers } from "../tables/reviewers.js";
import { decideRequest } from "../functions/decide-request.js";

/**
 * Run the decision for a request. This is the governed rule, gated to the
 * clinical_reviewer role at the API layer: a read_only auditor is refused here
 * (403) even though it may view and audit everywhere else. The work itself is
 * the shared decide_request function, so this endpoint and the submit
 * short-circuit produce identical, auditable results.
 */
export const decideQuery = query({
  name: "decide",
  verb: "POST",
  apiGroup: priorauthGroup,
  auth: reviewers,
  input: {
    request_id: input.int({ required: true }),
  },
  stack: [
    s.db.get_by_id({ table: reviewers, id: auth("id"), output: ["id", "email", "role"], as: "caller" }),
    s.precondition({
      expr: expr(ref("caller.role"), "=", c.text("clinical_reviewer")),
      error_type: "accessdenied",
      error: c.text("Only a clinical reviewer can run decisions."),
    }),
    s.function.run({
      fn: decideRequest,
      input: { request_id: inp("request_id"), actor: ref("caller.email") },
      as: "result",
    }),
  ],
  response: ref("result"),
});
