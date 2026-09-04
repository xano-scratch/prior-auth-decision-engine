import { table, f } from "@xanots/sdk";

/**
 * Who may use the engine. The auth table backing every protected endpoint.
 * `role` is the whole authorization story: a clinical_reviewer may run
 * decisions, a read_only auditor may only view and audit. That gate lives at
 * the API layer (a per-endpoint precondition on this column), never as
 * row-level security.
 */
export const reviewers = table({
  name: "reviewers",
  auth: true,
  schema: {
    email: f.email({ required: true }),
    // The column hashes on write. Seeded demo passwords are plaintext here on
    // purpose (throwaway credentials for a public ephemeral), so a reviewer can
    // sign in the moment the app deploys.
    password: f.password({ required: true }),
    name: f.text({ required: true }),
    role: f.enum(["clinical_reviewer", "read_only"], { required: true }),
  },
  index: [{ type: "unique", fields: [{ name: "email" }] }],
  seed: [
    {
      id: 1,
      email: "reviewer@examplehealth.test",
      password: "reviewer123",
      name: "Dana Okafor",
      role: "clinical_reviewer",
    },
    {
      id: 2,
      email: "auditor@examplehealth.test",
      password: "auditor123",
      name: "Sam Whitfield",
      role: "read_only",
    },
  ],
});
