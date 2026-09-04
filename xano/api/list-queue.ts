import { query, s, ref, c, col, expr } from "@xanots/sdk";
import { priorauthGroup } from "./groups.js";
import { reviewers } from "../tables/reviewers.js";
import { requests } from "../tables/requests.js";

/**
 * The pending intake queue: requests awaiting a decision, newest first. A
 * clinical reviewer decides them from here; a read_only auditor sees the same
 * list without the action.
 */
export const listQueueQuery = query({
  name: "queue",
  verb: "GET",
  apiGroup: priorauthGroup,
  auth: reviewers,
  stack: [
    s.db.query({
      table: requests,
      where: expr(col("status"), "=", c.text("pending")),
      sort: [{ sortBy: "created_at", dir: "desc" }],
      as: "rows",
    }),
  ],
  response: ref("rows"),
});
