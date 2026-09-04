import { query, input, s, ref, inp, c, expr, obj } from "@xanots/sdk";
import { authGroup } from "./groups.js";
import { reviewers } from "../tables/reviewers.js";

/**
 * Public sign-in. Verifies a reviewer's credentials and mints a bearer token.
 * The password is taken as text (not input.password, which would double-hash)
 * and read with an explicit output so the internal hash column is returned to
 * check_password.
 */
export const loginQuery = query({
  name: "login",
  verb: "POST",
  apiGroup: authGroup,
  auth: false,
  input: {
    email: input.text({ required: true, methods: ["trim", "lower"] }),
    password: input.text({ required: true }),
  },
  stack: [
    s.db.get({
      table: reviewers,
      fieldName: "email",
      fieldValue: inp("email"),
      output: ["id", "email", "name", "role", "password"],
      as: "u",
    }),
    // One generic message for a missing account or a bad password, so neither
    // is leaked.
    s.precondition({
      expr: expr(ref("u", { safe: true }), "!=", c.null()),
      error_type: "unauthorized",
      error: c.text("Invalid email or password."),
    }),
    s.security.check_password({
      text_password: inp("password"),
      hash_password: ref("u.password"),
      as: "ok",
    }),
    s.precondition({
      expr: expr(ref("ok"), "=", c.bool(true)),
      error_type: "unauthorized",
      error: c.text("Invalid email or password."),
    }),
    s.security.create_auth_token({ table: reviewers, id: ref("u.id"), as: "token" }),
  ],
  response: {
    token: ref("token"),
    reviewer: obj({
      id: ref("u.id"),
      email: ref("u.email"),
      name: ref("u.name"),
      role: ref("u.role"),
    }),
  },
});
