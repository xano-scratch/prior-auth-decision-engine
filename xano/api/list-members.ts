import { query, s, ref } from "@xanots/sdk";
import { priorauthGroup } from "./groups.js";
import { members } from "../tables/members.js";
import { reviewers } from "../tables/reviewers.js";

/** Members, for the new-request form's picker. */
export const listMembersQuery = query({
  name: "members",
  verb: "GET",
  apiGroup: priorauthGroup,
  auth: reviewers,
  stack: [s.db.query({ table: members, sort: [{ sortBy: "member_number", dir: "asc" }], as: "rows" })],
  response: ref("rows"),
});
