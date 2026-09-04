import { query, s, ref } from "@xanots/sdk";
import { priorauthGroup } from "./groups.js";
import { procedures } from "../tables/procedures.js";
import { reviewers } from "../tables/reviewers.js";

/** Procedures, for the new-request form's picker. */
export const listProceduresQuery = query({
  name: "procedures",
  verb: "GET",
  apiGroup: priorauthGroup,
  auth: reviewers,
  stack: [s.db.query({ table: procedures, sort: [{ sortBy: "code", dir: "asc" }], as: "rows" })],
  response: ref("rows"),
});
