import { query, input, s, ref, inp, c, expr, col } from "@xanots/sdk";
import { priorauthGroup } from "./groups.js";
import { reviewers } from "../tables/reviewers.js";
import { procedures } from "../tables/procedures.js";
import { criteriaSets } from "../tables/criteria-sets.js";
import { criteria } from "../tables/criteria.js";

/**
 * Inspect the ruleset for a procedure: the active criteria set with its ordered
 * rules (the exact logic that will be applied), plus every version on record so
 * a reviewer can see the retired ones. A non-gated procedure has no active set;
 * the endpoint returns a null active set and an empty rule list rather than
 * failing.
 */
export const getCriteriaQuery = query({
  name: "criteria/{procedure_id}",
  verb: "GET",
  apiGroup: priorauthGroup,
  auth: reviewers,
  input: {
    procedure_id: input.int({ required: true }),
  },
  stack: [
    s.db.get_by_id({ table: procedures, id: inp("procedure_id"), as: "procedure" }),
    s.precondition({
      expr: expr(ref("procedure", { safe: true }), "!=", c.null()),
      error_type: "notfound",
      error: c.text("Procedure not found."),
    }),
    s.db.query({
      table: criteriaSets,
      where: [expr(col("procedure_id"), "=", inp("procedure_id")), expr(col("status"), "=", c.text("active"))],
      returnType: "single",
      as: "active_set",
    }),
    // Only load rules when there is an active set (a non-gated procedure has
    // none), so the where clause never compares against a null set id.
    s.set_var("rules", c.array([])),
    s.conditional({
      when: expr(ref("active_set", { safe: true }), "!=", c.null()),
      then: [
        s.db.query({
          table: criteria,
          where: expr(col("criteria_set_id"), "=", ref("active_set.id")),
          sort: [{ sortBy: "sequence", dir: "asc" }],
          as: "active_rules",
        }),
        s.update_var("rules", ref("active_rules")),
      ],
    }),
    s.db.query({
      table: criteriaSets,
      where: expr(col("procedure_id"), "=", inp("procedure_id")),
      sort: [{ sortBy: "version", dir: "desc" }],
      as: "versions",
    }),
  ],
  response: {
    procedure: ref("procedure"),
    active_set: ref("active_set"),
    rules: ref("rules"),
    versions: ref("versions"),
  },
});
