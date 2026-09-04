import { query, s, ref, auth, obj } from "@xanots/sdk";
import { authGroup } from "./groups.js";
import { reviewers } from "../tables/reviewers.js";

/** The signed-in reviewer (drives the role-aware UI). */
export const meQuery = query({
  name: "me",
  verb: "GET",
  apiGroup: authGroup,
  auth: reviewers,
  stack: [
    s.db.get_by_id({
      table: reviewers,
      id: auth("id"),
      output: ["id", "email", "name", "role"],
      as: "u",
    }),
  ],
  response: obj({
    id: ref("u.id"),
    email: ref("u.email"),
    name: ref("u.name"),
    role: ref("u.role"),
  }),
});
