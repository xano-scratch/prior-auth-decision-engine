import { query, input, s, ref, inp, col, cmp } from "@xanots/sdk";
import { priorauthGroup } from "./groups.js";
import { reviewers } from "../tables/reviewers.js";
import { decisionLog } from "../tables/decision-log.js";

/**
 * The append-only audit trail, filtered by member number and/or procedure
 * code. Both filters are optional: ignoreEmpty drops a predicate whose operand
 * is empty, so an absent filter widens the query instead of matching nothing.
 * A read_only auditor may call this (any valid reviewer token is enough — there
 * is no clinical_reviewer gate here).
 */
export const auditQuery = query({
  name: "audit",
  verb: "GET",
  apiGroup: priorauthGroup,
  auth: reviewers,
  input: {
    member_number: input.text({ methods: ["trim"] }),
    procedure_code: input.text({ methods: ["trim"] }),
  },
  stack: [
    s.db.query({
      table: decisionLog,
      where: [
        cmp(col("member_number"), "=", inp("member_number"), { ignoreEmpty: true }),
        cmp(col("procedure_code"), "=", inp("procedure_code"), { ignoreEmpty: true }),
      ],
      sort: [{ sortBy: "created_at", dir: "desc" }],
      as: "rows",
    }),
  ],
  response: ref("rows"),
});
